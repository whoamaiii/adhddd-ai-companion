import React, { useState, useRef, useCallback } from 'react';
import { MAX_FILE_SIZE_MB } from '../constants';

interface ImageUploaderProps {
  onImageUpload: (imageDataUrls: string[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]); // Renamed for clarity
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newPreviewsTemp: string[] = [];
      const newErrorsTemp: string[] = [];
      
      setFileErrors([]); // Reset errors for new selection

      const filePromises = Array.from(files).map(file => {
        return new Promise<string | null>((resolve) => {
          if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            newErrorsTemp.push(`File "${file.name}" is too large (max ${MAX_FILE_SIZE_MB}MB).`);
            resolve(null);
            return;
          }
          if (!file.type.startsWith('image/')) {
            newErrorsTemp.push(`File "${file.name}" is not a valid image type.`);
            resolve(null);
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            newErrorsTemp.push(`Error reading file "${file.name}".`);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(filePromises);
      results.forEach(result => {
        if (result) {
          newPreviewsTemp.push(result);
        }
      });
      
      // Replace previews with the new selection to match mockup 4 behavior (new selection replaces old)
      setPreviews(newPreviewsTemp); 
      if (newErrorsTemp.length > 0) {
        setFileErrors(newErrorsTemp);
      }
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (previews.length > 0 && fileErrors.length === 0) {
      onImageUpload(previews);
    } else if (previews.length === 0) {
      setFileErrors(['Please select one or more images first.']);
    } else {
      // Errors exist, do nothing or prompt user to fix
       setFileErrors(prev => [...prev, 'Please resolve errors before analyzing.']);
    }
  }, [previews, onImageUpload, fileErrors.length]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    // Optionally, clear errors if all problematic files are removed
    if (previews.length -1 === 0) setFileErrors([]);
  };
  
  const addMoreImagesPlaceholder = previews.length < 5; // Arbitrary limit for "add more" slot

  return (
    <div className="p-4 md:p-6 text-left"> {/* Changed to text-left from text-center */}
      {/* Title section like in Mockup 3/4 header area */}
      <div className="mb-6">
          <h2 className="text-[var(--text-primary)] text-xl md:text-2xl font-bold leading-tight tracking-tight">
            Select images of the space you want to clean
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Our AI will analyze the images and create a tailored cleaning plan for you.
          </p>
      </div>
      
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        id="imageUploadInput"
        aria-label="Upload images"
      />
      
      {/* Image previews grid - Mockup 4 */}
      <div className={`grid ${previews.length > 0 ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1'} gap-3 mb-6`}>
        {previews.map((previewUrl, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-[var(--border-light)]">
            <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
            <button 
              onClick={() => removePreview(index)} 
              className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={`Remove image ${index + 1}`}
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        ))}
        {/* "Add more" placeholder, similar to Mockup 4 */}
        {addMoreImagesPlaceholder && (
           <button
            onClick={triggerFileInput}
            className="flex items-center justify-center aspect-square rounded-lg border-2 border-dashed border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-light-accent)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-colors cursor-pointer"
            aria-label="Add more images"
           >
            <i className="fas fa-plus text-2xl"></i>
          </button>
        )}
      </div>
      
      {/* "Choose Image(s)" button - Prominent if no previews, less so if previews exist */}
       {previews.length === 0 && (
          <button
            onClick={triggerFileInput}
            className="w-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-semibold py-3 px-4 rounded-xl shadow-md mb-4 transition duration-150 ease-in-out transform hover:scale-105 flex items-center justify-center"
            aria-label="Choose images to upload"
          >
            <i className="fas fa-camera mr-2"></i> Choose Image(s)
          </button>
        )}


      {fileErrors.length > 0 && (
        <div className="my-3 text-[var(--error-color)] text-sm space-y-1 bg-[var(--error-bg-light)] p-3 rounded-md">
          {fileErrors.map((err, index) => <p key={index}><i className="fas fa-exclamation-triangle mr-1"></i> {err}</p>)}
        </div>
      )}

      {previews.length > 0 && ( // Button now uses CSS vars for colors
        <button
          onClick={handleSubmit}
          disabled={fileErrors.length > 0}
          className={`w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg mt-4 transition duration-150 ease-in-out transform hover:scale-105 flex items-center justify-center
            ${fileErrors.length > 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-[var(--success-color)] hover:opacity-90'}`}
        >
          <i className="fas fa-magic mr-2"></i> Analyze {previews.length} Image(s) and Plan
        </button>
      )}
      
      <p className="text-xs text-[var(--text-secondary)] mt-6 text-center">
        Max file size per image: {MAX_FILE_SIZE_MB}MB.
      </p>
    </div>
  );
};
