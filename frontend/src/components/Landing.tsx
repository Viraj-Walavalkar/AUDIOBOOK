import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, BookOpen } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:5000/upload-pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      console.log("Response data:", data); // Debug log
      
      // Navigate with the pages data
      navigate('/read', { 
        state: { 
          pages: data.pages.map((page: string) => page.split('\n').filter(Boolean))
        } 
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <BookOpen className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Your Book</h1>
        <p className="text-gray-600">Choose a PDF file to start your audio book experience</p>
      </div>
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Upload Your Book</h1>
        <div className="flex flex-col items-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#8B4513] hover:bg-[#A0522D]'
            } text-white transition-colors`}
          >
            {isUploading ? 'Uploading...' : 'Choose PDF File'}
          </label>
        </div>
      </div>
    </div>
  );
};

export default Landing;