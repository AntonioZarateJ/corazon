import React, { useEffect, useState, useRef, memo } from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';
import { nanoid } from 'https://cdn.skypack.dev/nanoid@4.0.0';

const PATH_LENGTH = 1506;
const LAYERS = 20;
const LAYER_GAP = 2; // In pixels
const CONFETTI_COUNT = 50;
const CLICKS_TO_ACTIVATE = 5;

const clamp = (min, max, n) =>
  Math.min(max, Math.max(min, n));

const useDocumentEvent = (event, handler) => {
  useEffect(() => {
    const events = event.split(' ');
    events.forEach(event => document.addEventListener(event, handler));
    return () => events.forEach(event => document.removeEventListener(event, handler));
  }, []);
};

const usePerishable = () => {
  const [items, setItems] = useState([]);
  const timeouts = useRef({});

  useEffect(() => {
    return () => Object.values(timeouts.current).forEach(clearTimeout);
  }, []);

  return { items, add: (delay, data) => {
      const id = (data && data.id) || nanoid();
      const itemData = { ...data, id };
      setItems(arr => [...arr, itemData]);
      timeouts.current[id] = setTimeout(() => {
        setItems(items => items.filter(item => item.id !== id));
        delete timeouts.current[id];
      }, delay);
    } };
};

const useCursorTilt = ({ ref, tilt, bounds }) => {
  const [rotate, setRotate] = useState([0, 0]); 
  useDocumentEvent('mousemove', e => {
    requestAnimationFrame(() => {
      if (!ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const [x, y] = [e.clientX, e.clientY];
      const rect = bounds ?
      { top: top - bounds, left: left - bounds, width: width + bounds * 2, height: height + bounds * 2 } :
      { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

      setRotate([
      -(clamp(0, rect.height, y - rect.top) - rect.height / 2) / rect.height * tilt,
      (clamp(0, rect.width, x - rect.left) - rect.width / 2) / rect.width * tilt]);

    });
  });
  return rotate;
};

const Splash = memo(({ circles }) => {
  return /*#__PURE__*/(
    React.createElement("svg", { viewBox: "0 0 500 430", className: "splash" },
    circles.map(({ id }) => /*#__PURE__*/
    React.createElement(HeartPath, { key: id }))));
});


const HeartPath = () => /*#__PURE__*/
React.createElement("path", { d: "M500 143.64C500 286.45 321.49 322.15 250.08 429.26C178.68 322.15 0.17 286.45 0.17 143.64C0.17 72.24 53.72 0.83 142.98 0.83C214.38 0.83 250.08 72.24 250.08 72.24C250.08 72.24 285.79 0.83 357.19 0.83C446.45 0.83 500 72.24 500 143.64Z" });


const ShineSVG = ({ x, opacity, rotate, translateZ }) => /*#__PURE__*/
React.createElement("svg", { viewBox: "0 0 500 430", style: { transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(${translateZ}px) scale(0.9)` }, className: "heart-shine" }, /*#__PURE__*/
React.createElement("defs", null, /*#__PURE__*/
React.createElement("clipPath", { id: "heart" }, /*#__PURE__*/
React.createElement(HeartPath, null))), /*#__PURE__*/


React.createElement("rect", { x: 500 - x * 700, y: "0", width: "200", height: "430", fill: `rgba(255,255,255,${opacity}`, clipPath: "url(#heart)" }));



const HeartSVG = ({ rotate: { x, y }, translateZ, strokeDashoffset, scale = 1, className }) => /*#__PURE__*/
React.createElement("svg", { className: className, viewBox: "0 0 500 430", style: { transform: `rotateX(${x}deg) rotateY(${y}deg) translateZ(${translateZ}px) scale(${scale})`, strokeDashoffset } }, /*#__PURE__*/
React.createElement(HeartPath, null));


const Heart = ({ rotate }) => {
  const [love, setLove] = useState(1);
  const [pressed, setPressed] = useState(false);
  const { items, add } = usePerishable();
  const {x, y} = rotate; 
  const offset = Math.atan2(y, x) / Math.PI * (PATH_LENGTH / 2) + PATH_LENGTH / 2;
  
  useDocumentEvent('mouseup', () => {
    setPressed(pressed => {
      if (pressed) {
        setLove(a => {
          if (a >= 1) {
            return 0;
          }
          add(1000);
          return a + 0.3;
        });
      }
      return false;
    });
  });

  return /*#__PURE__*/(
    React.createElement("button", { className: "heart", onMouseDown: () => setPressed(true), style: { '--lightness': `${love * 80 + 20}%`, '--scale': 0.8 + love * 0.2 - pressed * 0.1 } }, /*#__PURE__*/
    React.createElement("div", { className: "inner-wrapper" }, /*#__PURE__*/
    React.createElement(Splash, { circles: items }),
    [...new Array(LAYERS)].map((_, i) => /*#__PURE__*/
    React.createElement(HeartSVG, { key: i, className: "heart-layer", rotate: { x, y }, translateZ: i * LAYER_GAP, scale: Math.sin(i / LAYERS * Math.PI) / 10 + 1 })), /*#__PURE__*/

    React.createElement(HeartSVG, { className: "heart-stroke", rotate: { x, y }, translateZ: (LAYERS + 1) * LAYER_GAP, strokeDashoffset: offset, scale: 0.9 }), /*#__PURE__*/
    React.createElement(ShineSVG, { x: y / 50 + 0.5, opacity: x / 200 + 0.5, rotate: { x, y }, translateZ: (LAYERS + 1) * LAYER_GAP }))));
};


const ConfettiHeart = ({ style, width, height }) => /*#__PURE__*/
React.createElement("svg", { className: "confetti-heart", style: style, width: width, height: height, viewBox: "0 0 500 430" }, /*#__PURE__*/
React.createElement(HeartPath, null));


const App = () => {
  const [clickCount, setClickCount] = useState(0);
  const [showText, setShowText] = useState(false);
  const { items: confetti, add: addConfetti } = usePerishable();
  
  const tiltRef = useRef();
  const [rotateX, rotateY] = useCursorTilt({ ref: tiltRef, tilt: 30, bounds: 50 });


  const handleScreenClick = (e) => {
    if (e.target.closest('.heart')) {
      return;
    }
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= CLICKS_TO_ACTIVATE) {
      if (newCount === CLICKS_TO_ACTIVATE) {
        setShowText(true);
      }
      
      for (let i = 0; i < CONFETTI_COUNT; i++) {
        const id = nanoid();
        const duration = Math.random() * 1.5 + 1;
        const size = Math.random() * 15 + 10;
        const hue = 334;
        const saturation = Math.floor(Math.random() * 30) + 70;
        const lightness = Math.floor(Math.random() * 30) + 50;
        
        const style = {
            top: `${e.clientY - size / 2}px`,
            left: `${e.clientX - size / 2}px`,
            '--end-x': `${(Math.random() - 0.5) * 400}px`,
            '--end-y': `${(Math.random() - 0.5) * 400}px`,
            '--start-rotation': `${Math.random() * 360}deg`,
            '--end-rotation': `${(Math.random() - 0.5) * 1080}deg`,
            '--duration': `${duration}s`,
            '--color': `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            '--start-scale': Math.random() + 0.5,
        };
        addConfetti(duration * 1000, { id, style, width: size, height: size });
      }
    }
  };

  return /*#__PURE__*/(
    React.createElement("div", { className: "app-container", onClick: handleScreenClick }, /*#__PURE__*/
      
      React.createElement("div", { className: "heart-text-wrapper", ref: tiltRef }, /*#__PURE__*/
        
        /*#__PURE__*/React.createElement("div", { 
          className: "princess-title",
          style: {
            transform: `rotateX(${rotateX * 0.7}deg) rotateY(${rotateY * 0.7}deg) translateZ(40px)`
          }
        }, /*#__PURE__*/
          React.createElement("div", { className: "title-container" }, /*#__PURE__*/
          React.createElement("span", { className: "star-left" }, "✨"),
          React.createElement("span", { className: "title-text" }, "Para mi hermosa Iren 💖"),
          React.createElement("span", { className: "star-right" }, "✨")
          )
        ),
        
        /*#__PURE__*/React.createElement(Heart, { rotate: { x: rotateX, y: rotateY } }), /*#__PURE__*/
        
        /*#__PURE__*/React.createElement("div", { 
            className: "love-text-container",
            style: {
                opacity: showText ? 1 : 0,
                transform: `translate3d(-50%, 0, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(60px) translateY(${showText ? 0 : 25}px)`
            }
        }, /*#__PURE__*/
          React.createElement("div", { className: "love-text-line" }, "Te Amo"),
          React.createElement("div", { className: "love-text-line" }, "mi bella princesa"),
          React.createElement("div", { className: "love-image-wrapper" }, /*#__PURE__*/
            React.createElement("img", { 
              src: "love.jpg", 
              alt: "Mi princesa",
              className: "love-image"
            })
          )
        )
      ),
      
      confetti.map(({ id, style, width, height }) => /*#__PURE__*/
        React.createElement(ConfettiHeart, { key: id, style: style, width: width, height: height })
      ),
      
      /*#__PURE__*/React.createElement(React.Fragment, null,
        [...Array(8)].map((_, i) => /*#__PURE__*/
          React.createElement("div", {
            key: i,
            className: "floating-star",
            style: {
              '--star-delay': `${i * 0.5}s`,
              '--star-size': `${Math.random() * 20 + 10}px`,
              '--star-x': `${Math.random() * 100}%`,
              '--star-y': `${Math.random() * 100}%`,
              '--star-duration': `${Math.random() * 3 + 5}s`
            }
          }, "⭐")
        )
      )
    )
  );
};


ReactDOM.render( /*#__PURE__*/
React.createElement(App, null),
document.body);