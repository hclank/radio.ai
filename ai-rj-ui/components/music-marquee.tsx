import React from "react";

const MusicalWaveMarquee = ({
  speed = 15,
  amplitude = 50,
  color = "#00ffcc",
}) => {
  // A variety of musical symbols: Quarter note, Eighth note, Beamed notes, Sharp, Flat, etc.
  const notes = ["♪"];

  // Create a long string of randomized notes and spacing
  const repeatedNotes = new Array(20)
    .fill(null)
    .map(() => notes[Math.floor(Math.random() * notes.length)] + "  ")
    .join("   ");

  // We duplicate the string to ensure the loop is seamless
  const fullPathContent = `${repeatedNotes} ${repeatedNotes} ${repeatedNotes}`;

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        background: "#000",
        padding: "100px 0",
      }}
    >
      <svg
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        style={{ width: "200%", height: "300px", marginLeft: "-50%" }}
      >
        <defs>
          {/* Tileable Sine Wave Path */}
          <path
            id="musicPath"
            d={`M 0 100 
                q 125 -${amplitude} 250 0 
                t 250 0 
                t 250 0 
                t 250 0 
                t 250 0`}
          />
        </defs>

        <text
          style={{
            fill: color,
            fontSize: "45px",
            fontFamily: "serif",
            textShadow: `0 0 10px ${color}44`, // Subtle glow
          }}
        >
          <textPath href="#musicPath" startOffset="0%">
            {fullPathContent}

            <animate
              attributeName="startOffset"
              from="0%"
              to="-50%"
              dur={`${speed}s`}
              repeatCount="indefinite"
            />
          </textPath>
        </text>
      </svg>
    </div>
  );
};

export default MusicalWaveMarquee;
