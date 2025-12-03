import React from 'react';
import styled from 'styled-components';

interface GrumpySearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const GrumpySearch: React.FC<GrumpySearchProps> = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <StyledWrapper>
      <div className="container">
        <div className="input-wrapper">
          <div className="input">
            <div className="glow left" />
            <div className="glow right" />
            <input 
                type="text" 
                name="text" 
                placeholder={placeholder} 
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <div className="reflection" />
            <div className="icon">
              <svg stroke="#fff" viewBox="0 0 38 38" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className="loading">
                <g fillRule="evenodd" fill="none">
                  <g strokeWidth={3} transform="translate(1 1)">
                    <circle r={18} cy={18} cx={18} strokeOpacity=".2" />
                    <path d="M36 18c0-9.94-8.06-18-18-18" />
                  </g>
                </g>
              </svg>
              <svg viewBox="0 0 490.4 490.4" version="1.1" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="magnifier">
                <path d="M484.1,454.796l-110.5-110.6c29.8-36.3,47.6-82.8,47.6-133.4c0-116.3-94.3-210.6-210.6-210.6S0,94.496,0,210.796   s94.3,210.6,210.6,210.6c50.8,0,97.4-18,133.8-48l110.5,110.5c12.9,11.8,25,4.2,29.2,0C492.5,475.596,492.5,463.096,484.1,454.796z    M41.1,210.796c0-93.6,75.9-169.5,169.5-169.5s169.6,75.9,169.6,169.5s-75.9,169.5-169.5,169.5S41.1,304.396,41.1,210.796z" />
              </svg>
            </div>
          </div>
          <div className="glow-outline" />
          <div className="glow-layer-bg" />
          <div className="glow-layer-1" />
          <div className="glow-layer-2" />
          <div className="glow-layer-3" />
          <div className="glow left" />
          <div className="glow right" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100%;
  
  .container {
    --ease-elastic: cubic-bezier(0.7, -0.5, 0.3, 1.5);
    --icon-color: #bcacbd;
    --glow-l-color: #8422b1;
    --glow-r-color: #0d00ff;
    --input-radius: 14px;
    --result-item-h: 33.5px;

    /* Removed fixed background and height to fit in flow */
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Removed opacity animation to avoid flicker */
  }

  /* Removed .bg styles as they were for full screen demo */

  .input-wrapper {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 800px; /* Increased width for large screens */
  }

  .input {
    background-color: #010201;
    border-radius: var(--input-radius);
    position: relative;
    z-index: 10;
    width: 100%;
  }

  .reflection {
    position: absolute;
    inset: 0;
    z-index: 9;
    border-radius: var(--input-radius);
    pointer-events: none;
    overflow: hidden;
  }
  .reflection:before {
    content: "";
    position: absolute;
    width: 500px;
    background-color: rgba(255, 255, 255, 0.2);
    background: linear-gradient(
      to right,
      rgba(244, 221, 255, 0.1) 10%,
      rgba(244, 221, 255, 0.5) 60%,
      rgba(244, 221, 255, 0.3) 60%,
      rgba(244, 221, 255, 0.1) 90%
    );
    top: 0;
    bottom: 0;
    opacity: 0.3;
    transform: translateX(-540px) skew(-40deg);
  }
  .reflection::after {
    content: "";
    position: absolute;
    left: 68px;
    right: 50%;
    top: 10px;
    bottom: 10px;
    z-index: -1;
    background: linear-gradient(to right, transparent, rgba(2, 2, 2, 0.6));
  }
  .input:focus-within .reflection:before {
    transition: all 1.2s cubic-bezier(0.5, 0, 0.3, 1);
    transform: translate(440px, 0) skew(40deg) scaleX(0.5);
  }

  .input input {
    width: 100%;
    height: 60px;
    padding: 0 67px;
    font-size: 20px;
    background: none;
    border: none;
    color: white;
    position: relative;
    transition: all 0.5s var(--ease-elastic);
    outline: none;
    border-radius: var(--input-radius);
    z-index: 2;
    box-sizing: border-box;
  }

  .input input::placeholder {
    color: #d6d0d6;
  }

  .icon {
    display: grid;
    place-items: center;
    position: absolute;
    left: 14px;
    top: 8px;
    bottom: 8px;
    width: 42px;
    font-size: 24px;
    color: var(--icon-color);
    z-index: 3;
    pointer-events: none;
  }
  .icon svg {
    grid-area: 1 / 1;
    transition: opacity 0.5s linear, transform 0.2s ease;
    overflow: visible;
  }
  .icon svg.loading > g {
    transform-origin: center;
    animation: spinner 1s linear infinite;
  }
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }

  /* Lights */

  .glow {
    width: 20%;
    height: 25%;
    border-radius: 50%;
    opacity: 0.7;
    filter: blur(40px);
    position: absolute;
    margin: auto;
    z-index: -1;
    animation: glow 2s cubic-bezier(0.6, 0, 0.6, 1) infinite;
  }
  @keyframes glow {
    50% {
      width: 30%;
      filter: blur(50px);
    }
  }
  .input .glow {
    width: 10%;
    height: 0px;
    filter: blur(10px);
    opacity: 0.3;
    animation: none;
  }
  .glow.left {
    box-shadow: 0 0 40px 30px var(--glow-l-color);
    background-color: var(--glow-l-color);
    left: 0;
    top: 25%;
  }
  .glow.right {
    box-shadow: 0 0 40px 30px var(--glow-r-color);
    background-color: var(--glow-r-color);
    right: 0;
    bottom: 25%;
  }
  .glow-layer-bg,
  .glow-outline {
    position: absolute;
    border-radius: var(--input-radius);
    overflow: hidden;
  }
  .glow-layer-bg {
    z-index: -1;
    inset: -2px;
    background: rgb(27, 27, 27);
  }
  .glow-outline {
    z-index: 9;
    inset: -1px;
    transition: all 0.3s linear;
    opacity: 0;
  }
  .glow-outline::before {
    position: absolute;
    inset: 0;
    content: "";
    width: 110px;
    height: 420px;
    margin: auto;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(197, 134, 203, 0.5),
      transparent
    );
    animation: spin 3s linear infinite;
    animation-play-state: paused;
  }
  .input-wrapper:hover .glow-outline::before {
    animation-play-state: running;
  }
  .input-wrapper:hover .glow-outline {
    opacity: 1;
  }
  .input-wrapper:focus-within .glow-outline {
    transition-duration: 0.2s;
    opacity: 0;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .glow-layer-1 {
    content: "";
    inset: -2px;
    filter: blur(10px);
    position: absolute;
    border-radius: calc(var(--input-radius) * 1.1);
    background: linear-gradient(152deg, rgb(226 0 255 / 20%), rgb(0 0 0 / 0%) 40%),
      linear-gradient(330deg, rgba(65, 66, 82, 0.9), rgb(0 0 0 / 0%) 40%),
      linear-gradient(40deg, rgba(180, 93, 184, 0.3), rgb(0 0 0 / 0%) 40%),
      linear-gradient(220deg, rgb(81 52 157 / 80%), rgb(0 0 0 / 0%) 40%);
  }
  .glow-layer-1::before,
  .glow-layer-1::after {
    content: "";
    position: absolute;
    width: 30%;
    height: 75%;
    border-radius: 20%;
    box-shadow: 0 0 50px currentColor;
    transition: all 0.5s cubic-bezier(0.6, 0, 0.6, 1);
  }
  .input-wrapper:focus-within .glow-layer-1::before,
  .input-wrapper:focus-within .glow-layer-1::after {
    width: 70%;
    height: 95%;
  }
  .glow-layer-1::before {
    left: 0;
    top: 0;
    background: linear-gradient(to right, #c44e93 40%, transparent 100%);
  }
  .glow-layer-1::after {
    right: 0;
    bottom: 0;
    background: linear-gradient(to left, #584ec4 40%, transparent 100%);
  }
  .glow-layer-2::before,
  .glow-layer-2::after,
  .glow-layer-3::before,
  .glow-layer-3::after {
    content: "";
    position: absolute;
    width: 20%;
    height: 70%;
  }
  .glow-layer-2::before,
  .glow-layer-3::before {
    width: 70%;
    height: 80%;
    border-radius: calc(var(--input-radius) * 1.2) 100% 0 20%;
  }
  .glow-layer-2::after,
  .glow-layer-3::after {
    width: 70%;
    height: 100%;
    border-radius: 0 50% calc(var(--input-radius) * 1.2) 100%;
  }
  .glow-layer-2 {
    inset: -5px;
    position: absolute;
    filter: blur(3px);
    z-index: 2;
  }
  .glow-layer-2::before {
    left: 0;
    top: 0;
    background: radial-gradient(at left top, #ff07b0, transparent 70%);
  }
  .glow-layer-2::after {
    right: 0;
    bottom: 0;
    background: radial-gradient(at right bottom, #7b0ac7, transparent 70%);
  }
  .glow-layer-3 {
    inset: -3px;
    position: absolute;
    z-index: 2;
  }
  .glow-layer-3::before,
  .glow-layer-3::after {
    filter: blur(1.5px);
  }
  .glow-layer-3::before {
    left: 0;
    top: 0;
    background: radial-gradient(at left top, white, transparent 70%);
  }
  .glow-layer-3::after {
    right: 0;
    bottom: 0;
    background: radial-gradient(at right bottom, white, transparent 70%);
  }

  /* States */

  .input input:focus:not(:placeholder-shown) ~ .icon .magnifier,
  .icon .loading {
    opacity: 0;
  }

  .input input:focus:not(:placeholder-shown) ~ .icon .loading,
  .icon .magnifier {
    opacity: 1;
    transition-delay: 0.3s;
    filter: blur(0px);
    transform: scale(1) translate(none);
  }

  .input input:focus:not(:placeholder-shown) ~ .icon .magnifier {
    transform: scale(1.2) translate(1.7px, 1.7px);
  }
`;

export default GrumpySearch;
