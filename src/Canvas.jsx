import React, { useEffect, useReducer, useRef, useState } from "react";
import BrightnessSlider from "./components/BrightnessSlider";
import ColorSlider from "./components/ColorSlider";

const fromCanvas = canvasRef => {
  const canvas = canvasRef.current;
  const [w, h] = [canvas.width, canvas.height];
  const context = canvas.getContext("2d");
  const imageData = context.createImageData(w, h);
  const pixels = imageData.data;
  return { canvas, w, h, context, imageData, pixels };
};

const getOriginalPixels = (canvas, image) => {
  if (canvas) {
    const [w, h] = [canvas.width, canvas.height];
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, w, h).data;
  }
  return [];
};

const applyColor = (color, value, pixels, originalPixels) => {
  const colors = ["red", "green", "blue"];
  const colorIndex = colors.indexOf(color);
  for (let p = colorIndex; p < pixels.length; p += 4) {
    pixels[p] = originalPixels[p] + value;
  }
  return pixels;
};

const reducer = (state, action) => {
  const { value, originalPixels } = action.payload;
  let pixels = Uint8ClampedArray.from(state.currentPixels);
  switch (action.type) {
    case "initial":
      return { currentPixels: action.payload };
    case "color":
      const { color } = action.payload;
      pixels = applyColor(color, value, pixels, originalPixels);
      return { currentPixels: pixels };
    case "brightness":
      const { currentColors } = action.payload;
      let currentColoredPixels;
      for (const colorName in currentColors) {
        currentColoredPixels = applyColor(
          colorName,
          currentColors[colorName],
          pixels,
          originalPixels
        );
      }
      for (let p = 0; p < pixels.length; p += 1) {
        if (p % 4 !== 3) {
          pixels[p] = currentColoredPixels[p] + value;
        } else {
          pixels[p] = originalPixels[p];
        }
      }
      return { currentPixels: pixels };
    default:
      throw new Error();
  }
};

export default () => {
  const [originalPixels, setOriginalPixels] = useState([]);
  const [brightness, setBrightness] = useState(0);
  const [red, setRed] = useState(0);
  const [green, setGreen] = useState(0);
  const [blue, setBlue] = useState(0);
  const canvasRef = useRef(null);
  const initialState = { currentPixels: new Uint8ClampedArray() };
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const op = getOriginalPixels(canvasRef.current, image);
      setOriginalPixels(op);
      dispatch({ type: "initial", payload: op });
    };
    image.crossOrigin = "Anonymous";
    image.src = "tubulin.png";
  }, []);

  useEffect(() => {
    const { canvas, w, h, context, imageData, pixels } = fromCanvas(canvasRef);
    for (let p = 0; p < pixels.length; p++) {
      pixels[p] = state.currentPixels[p];
    }
    context.putImageData(imageData, 0, 0);
  }, [brightness, red, green, blue]);

  const currentColors = { red, green, blue };
  return (
    <>
      <h1>Canvas</h1>
      <canvas
        ref={canvasRef}
        width="400"
        height="600"
        style={{ border: "1px solid red" }}
      />
      <BrightnessSlider
        callback={value => {
          setBrightness(value);
          dispatch({
            type: "brightness",
            payload: { value, originalPixels, currentColors }
          });
        }}
      />
      <ColorSlider
        callback={value => {
          setRed(value);
          dispatch({
            type: "color",
            payload: { color: "red", value, originalPixels }
          });
        }}
        color={"red"}
      />
      <ColorSlider
        callback={value => {
          setGreen(value);
          dispatch({
            type: "color",
            payload: { color: "green", value, originalPixels }
          });
        }}
        color={"green"}
      />
      <ColorSlider
        callback={value => {
          setBlue(value);
          dispatch({
            type: "color",
            payload: { color: "blue", value, originalPixels }
          });
        }}
        color={"blue"}
      />
    </>
  );
};
