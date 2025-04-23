import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { uploadPDF, getDialogues, generateAudio } from '../services/api';
import { useLocation } from 'react-router-dom';

// Import images for page 1
import page1Image1 from '../images/page 1/1.jpg';
import page1Image2 from '../images/page 1/2.jpg';
import page1Image3 from '../images/page 1/3.jpg';
import page1Image4 from '../images/page 1/4.jpg';
import page2Image1 from '../images/page 2/1.png';
import page2Image2 from '../images/page 2/2.png';
import page2Image3 from '../images/page 2/3.png';
import page2Image4 from '../images/page 2/4.png';
import page3Image1 from '../images/page 3/1.png';
import page3Image2 from '../images/page 3/2.png';
import page3Image3 from '../images/page 3/3.png';
import page3Image4 from '../images/page 3/4.png';
import page4Image1 from '../images/page 4/1.png';
import page4Image2 from '../images/page 4/2.png';
import page4Image3 from '../images/page 4/3.jpg';


// Organize images by page
const bookImages = [
  [page1Image1, page1Image2, page1Image3, page1Image4],
  [page2Image1, page2Image2, page2Image3, page2Image4],
  [page3Image1, page3Image2, page3Image3, page3Image4],
  [page4Image1, page4Image2, page4Image3]
];

const BookViewer = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [pageContents, setPageContents] = useState<string[][]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Set the page contents when component mounts
  useEffect(() => {
    if (location.state?.pages) {
      setPageContents(location.state.pages);
    }
  }, [location.state]);
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bookImages[currentPage].length);
    }, 5000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [currentPage]);

  const handlePageTurn = (direction: 'next' | 'prev') => {
    if (isFlipping) return;

    setFlipDirection(direction);
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentPage((prev) => {
        const newPage = direction === 'next' ? prev + 1 : Math.max(0, prev - 1);
        setCurrentImageIndex(0); // Reset image index for new page
        return newPage;
      });
      setTimeout(() => {
        setIsFlipping(false);
      }, 600);
    }, 300);
  };

  // Render the content section with dynamic paragraphs
  const renderPageContent = () => {
    // Check if currentPage is within bounds
    if (currentPage < 0 || currentPage >= pageContents.length) {
      return <div>No content available for this page.</div>;
    }

    const currentContent = pageContents[currentPage] || [];

    if (currentContent.length === 0) {
      return (
        <div className="animate-pulse space-y-4">
          <div className="bg-[#2c1810] bg-opacity-10 rounded w-3/4"></div>
          <div className="bg-[#2c1810] bg-opacity-10 rounded w-full"></div>
          <div className="bg-[#2c1810] bg-opacity-10 rounded w-5/6"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {currentContent.map((paragraph, index) => (
          <p 
            key={index} 
            className="leading-relaxed text-base font-baskerville"
            style={{
              textIndent: typeof paragraph === 'string' && 
                (paragraph.startsWith("'") || paragraph.startsWith('"')) ? '0' : '2em'
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  // Handle audio generation
  const handleAudioGeneration = async () => {
    if (!pageContents[currentPage]) return;
    
    try {
      const response = await generateAudio(pageContents[currentPage].join('\n'));
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating audio:', error);
    }
  };

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#2a2a2a]">
      <div className="w-full max-w-6xl aspect-[16/10] relative book-container">
        <div className="absolute inset-0 bg-[#8B4513] rounded-lg shadow-[0_30px_50px_rgba(0,0,0,0.3)]">
          <div className="flex h-full relative z-10">
            {/* Static Left Page (Content) */}
            <div className="w-1/2 h-full bg-[#f4e4bc] rounded-l-lg shadow-[inset_0_0_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&q=80')] opacity-5 bg-repeat"></div>
              <div className="h-full p-8 overflow-y-auto prose prose-stone max-w-none relative">
                <h2 className="text-[#2c1810] font-baskerville text-2xl mb-6">Page {currentPage + 1}</h2>
                <article className="text-[#2c1810] font-baskerville space-y-4">
                  {renderPageContent()}
                </article>
              </div>
              <div className="absolute right-0 top-0 w-4 h-full bg-gradient-to-l from-[rgba(0,0,0,0.2)] to-transparent"></div>
            </div>

            {/* Right Side Container */}
            <div className="w-1/2 h-full relative perspective-[2000px]">
              {/* Current Image (Static) */}
              <div className="absolute inset-0">
                <div className="w-full h-full bg-[#f4e4bc] rounded-r-lg shadow-[inset_0_0_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&q=80')] opacity-5 bg-repeat"></div>
                  <div className="h-full flex items-center justify-center p-8 relative">
                    <motion.img
                      key={`static-${currentImageIndex}`}
                      src={bookImages[currentPage][currentImageIndex]}
                      alt={`Book illustration ${currentImageIndex + 1}`}
                      className="max-h-full object-contain rounded shadow-md"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: isFlipping ? 0 : 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Flipping Page */}
              <AnimatePresence initial={false} mode="wait">
                {isFlipping && (
                  <motion.div
                    key={`flip-${currentPage}`}
                    className="absolute inset-0 origin-left"
                    initial={{ rotateY: flipDirection === 'next' ? 0 : -180 }}
                    animate={{ rotateY: flipDirection === 'next' ? 180 : 0 }}
                    exit={{ rotateY: flipDirection === 'next' ? 180 : 0 }}
                    transition={{
                      duration: 0.8,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    {/* Front of flipping page */}
                    <div className="absolute inset-0 backface-hidden">
                      <div className="w-full h-full bg-[#f4e4bc] rounded-r-lg shadow-[inset_0_0_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&q=80')] opacity-5 bg-repeat"></div>
                        <div className="h-full flex items-center justify-center p-8 relative">
                          <img
                            src={bookImages[currentPage][currentImageIndex]}
                            alt={`Current page ${currentImageIndex + 1}`}
                            className="max-h-full object-contain rounded shadow-md"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Back of flipping page */}
                    <div className="absolute inset-0 backface-hidden transform rotateY-180">
                      <div className="w-full h-full bg-[#f4e4bc] rounded-l-lg shadow-[inset_0_0_30px_rgba(0,0,0,0.2)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&q=80')] opacity-5 bg-repeat"></div>
                        <div className="h-full flex items-center justify-center p-8 relative">
                          <img
                            src={bookImages[currentPage][(currentImageIndex + 1) % bookImages[currentPage].length]}
                            alt={`Next page ${currentImageIndex + 2}`}
                            className="max-h-full object-contain rounded shadow-md"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center mt-12 space-x-8">
        <button
          onClick={() => handlePageTurn('prev')}
          title="Previous Page"
          className="p-3 rounded-full bg-[#8B4513] text-[#f4e4bc] hover:bg-[#A0522D] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentPage === 0 || isFlipping}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={ () =>{
              handleAudioGeneration();
              setIsPlaying(!isPlaying);
            }
          }
          title="Playing button"
          className={`p-4 rounded-full ${
            isPlaying ? 'bg-[#8B4513]' : 'bg-[#A0522D]'
          } text-[#f4e4bc] hover:opacity-90 transition-colors shadow-lg transform hover:scale-105`}
        >
          <Volume2 className="h-6 w-6" />
        </button>

        <button
          onClick={() => handlePageTurn('next')}
          title="Next Page"
          className="p-3 rounded-full bg-[#8B4513] text-[#f4e4bc] hover:bg-[#A0522D] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isFlipping}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Add audio player */}
      {audioUrl && (
        <audio 
          controls 
          src={audioUrl} 
          className="mt-4"
        />
      )}
    </div>
  );
};

export default BookViewer;