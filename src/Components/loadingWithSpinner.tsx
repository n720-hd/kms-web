const LoadingWithSpinner = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="animate-fade-in transition-opacity duration-1000">
        <div className="w-16 h-16 border-4 border-t-[#0b64ff] border-gray-200 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 text-lg animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingWithSpinner