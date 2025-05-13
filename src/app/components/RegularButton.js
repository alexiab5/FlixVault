const RegularButton = ({ children, text, className = '', ...props }) => {
  return (
    <button 
      className={`bg-[#FD4676] text-white rounded-full text-lg shadow-md hover:bg-[#FF346A] py-2 px-4 cursor-pointer ${className}`}
      {...props}
    >
      {text || children}
    </button>
  );
};

export default RegularButton;