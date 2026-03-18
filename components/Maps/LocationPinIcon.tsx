import React from 'react';
import Svg, { ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

const LocationPinIcon = ({ size = 45, color = '#02A348' }: { size?: number; color?: string }) => {
  const scale = size / 75; // Original height is 75
  const width = 58 * scale;
  const height = 75 * scale;

  return (
    <Svg width={width} height={height} viewBox="0 0 58 75" fill="none">
      <Defs>
        <ClipPath id="clip0">
          <Rect width="57.2" height="74.3596" fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip0)">
        {/* Shadow */}
        <Ellipse cx="28.6" cy="69.3527" rx="11.9167" ry="4.7663" fill="black" fillOpacity={0.25} />
        {/* Pin body */}
        <Path
          d="M28.6 2.62378C16.0959 2.62378 5.95837 12.7606 5.95837 25.264C5.95837 41.3504 28.6 69.3527 28.6 69.3527C28.6 69.3527 51.2417 41.3504 51.2417 25.264C51.2417 12.7606 41.1042 2.62378 28.6 2.62378Z"
          fill={color}
        />
        {/* White circle */}
        <Path
          d="M28.6 35.9883C34.5233 35.9883 39.325 31.1868 39.325 25.264C39.325 19.3411 34.5233 14.5397 28.6 14.5397C22.6767 14.5397 17.875 19.3411 17.875 25.264C17.875 31.1868 22.6767 35.9883 28.6 35.9883Z"
          fill="white"
        />
        {/* Inner colored circle */}
        <Path
          d="M28.6001 31.2219C31.8908 31.2219 34.5584 28.5545 34.5584 25.264C34.5584 21.9735 31.8908 19.306 28.6001 19.306C25.3094 19.306 22.6417 21.9735 22.6417 25.264C22.6417 28.5545 25.3094 31.2219 28.6001 31.2219Z"
          fill={color}
        />
      </G>
    </Svg>
  );
};

export default LocationPinIcon;