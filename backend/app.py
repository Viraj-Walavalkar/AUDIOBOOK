from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import os
from PyPDF2 import PdfReader
from pydub import AudioSegment
from groq import Groq
from elevenlabs.client import ElevenLabs
import json
from dotenv import load_dotenv

# Load .env
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# ElevenLabs setup
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)



# Voice map
voice_variants = {
    "Jo": "0ZOhGcBopt9S6GBK8tnj",
    "Meg": "FGY2WhTYpPnrIDTdsKH5",
    "Amy": "jsCqWAovK2LkecY7zXl4",
    "Beth": "oWAxZDx7w5VEj9dCyTzz",
    "Narrator": "t0jbNlBVZ17f02VDIeMI",
    "Unknown": "21m00Tcm4TlvDq8ikWAM"
}

# Helper Functions

def extract_text_from_pdf(file_stream):
    text_per_page = []
    pdf = PdfReader(file_stream)
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            text = text.replace('\n', ' ')
        text_per_page.append(text)
    return text_per_page


def get_completion(prompt):
    try:
        client = Groq(api_key="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")
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model="llama3-70b-8192",
            temperature=0.1  
        )
        response = chat_completion.choices[0].message.content
        return response
    except Exception as e:
        return "An error occurred while generating the response."

def extract_json(input_text):
    try:
        start = input_text.find('{')
        end = input_text.rfind('}')
        if start != -1 and end != -1:
            json_str = input_text[start:end + 1]
            return json.loads(json_str)
        return {"error": "No JSON structure found"}
    except Exception as e:
        return {"error": str(e)}

def extract_dialogues_with_groq(text):
    prompt = f"""
Extract all character dialogues and narrator text from the given book page. Identify each speaker and associate their spoken lines with them in sequential order. If the text is not a dialogue, label it as "Narrator".

{{
    "dialogues": [
        {{
            "character": "Character Name",
            "dialogue": "Spoken line of the character."
        }},
        {{
            "character": "Narrator",
            "dialogue": "Descriptive text between dialogues."
        }}
    ]
}}

Text to process:
{text}
"""
    response = get_completion(prompt)
    return extract_json(response).get("dialogues", [])

def text_to_speech(dialogue):
    character = dialogue.get("character", "Unknown")
    text = dialogue.get("dialogue", "")
    voice_id = voice_variants.get(character, voice_variants["Unknown"])

    audio = eleven_client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    audio_bytes = b"".join(audio)
    segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="mp3")
    silence = AudioSegment.silent(duration=1000)
    return segment + silence

def combine_audio(dialogues):
    clips = [text_to_speech(d) for d in dialogues]
    return sum(clips, AudioSegment.silent(duration=1000))

# API Endpoints

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if not file.filename.endswith('.pdf'):
        return jsonify({"error": "Invalid file type. Please upload a PDF file"}), 400
        
    try:
        pages = extract_text_from_pdf(file)
        print("Extracted pages:", pages)  # Debug print
        return jsonify({"pages": pages})
    except Exception as e:
        print("Error:", str(e))  # Debug print
        return jsonify({"error": str(e)}), 500

@app.route('/get-dialogues', methods=['POST'])
def get_dialogues():
    data = request.json
    page_text = data.get("text", "")
    dialogues = extract_dialogues_with_groq(page_text)
    return jsonify({"dialogues": dialogues})


@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    data = request.json
    page_text = data.get("text", "")
    dialogues = extract_dialogues_with_groq(page_text)
    audio = combine_audio(dialogues)
    
    buffer = io.BytesIO()
    audio.export(buffer, format="mp3")
    buffer.seek(0)
    return send_file(buffer, mimetype="audio/mpeg", as_attachment=False, download_name="audiobook.mp3")

if __name__ == '__main__':
    app.run(debug=True)
