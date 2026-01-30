import "./header.css";
import ASCIIText from "../../bits/AsciiText.jsx";
function Header() {
  return (
    <div className="header-container">
      <ASCIIText
        enableWaves={false}
        asciiFontSize={6}
        text="furni"
        textFontSize={200}
        planeBaseHeight={2}
        textColor="#fd86f7"
      />
    </div>
  );
}

export default Header;
