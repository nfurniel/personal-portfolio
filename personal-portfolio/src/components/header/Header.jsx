import "./header.css";
import ASCIIText from "../../bits/AsciiText.jsx";
function Header() {
  return (
    <div className="header-container">
      <ASCIIText
        enableWaves={false}
        asciiFontSize={5}
        text="furni.dev"
        textFontSize={300}
        planeBaseHeight={6}
        textColor="#ffffff"
      />

      <div id="social-media">
        <p>Instagram</p>
        <p>Twitter</p>
      </div>
    </div>
  );
}

export default Header;
