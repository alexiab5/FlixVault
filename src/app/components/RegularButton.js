const RegularButton = ({ text, onClick }) => {
  return (
    <button onClick={onClick} className="bg-[#FD4676] text-white rounded-full text-lg shadow-md hover:bg-[#FF346A] py-2 px-4 cursor-pointer">
      {text}
    </button>
  );
};

export default RegularButton;