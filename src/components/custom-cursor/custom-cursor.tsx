import { Color, Polyline, Renderer, Transform, Vec3 } from "ogl-typescript";
import { useEffect, useRef } from "react";

import "./custom-cursor.scss";

const CustomCursor = () => {
  const vertex = /* glsl */ `
      precision highp float;
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;
      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;
      vec4 getPosition() {
          vec4 current = vec4(position, 1);
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1);
          vec2 nextScreen = next.xy * aspect;
          vec2 prevScreen = prev.xy * aspect;
      
          // Calculate the tangent direction
          vec2 tangent = normalize(nextScreen - prevScreen);
      
          // Rotate 90 degrees to get the normal
          vec2 normal = vec2(-tangent.y, tangent.x);
          normal /= aspect;
          // Taper the line to be fatter in the middle, and skinny at the ends using the uv.y
          normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0) );
          // When the points are on top of each other, shrink the line to avoid artifacts.
          float dist = length(nextScreen - prevScreen);
          normal *= smoothstep(0.0, 0.02, dist);
          float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
          float pixelWidth = current.w * pixelWidthRatio;
          normal *= pixelWidth * uThickness;
          current.xy -= normal * side;
      
          return current;
      }
      void main() {
          gl_Position = getPosition();
      }
  `;

  const performanceObserver = useRef<PerformanceObserver>();
  const isCursorVisible = useRef(false);

  useEffect(() => {
    // Display based on performance
    async function asyncFunction() {
      try {
        if (await isPerformanceBetterThan(1200)) {
          const isMobileDevice = window.matchMedia("(pointer:coarse)").matches;
          if (!isMobileDevice) {
            renderCursor();
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    asyncFunction();

    // Or display anyway
    // if (!isCursorVisible.current) {
    //   renderCursor();
    // }

    return () => {
      performanceObserver.current?.disconnect();
    };
  }, []);

  const isPerformanceBetterThan = (threshold: number) => {
    return new Promise((resolve, reject) => {
      const handleEvent = (entry: any) => {
        performanceObserver.current?.disconnect();
        console.log("Event entry", entry);
        if (entry.duration < threshold / 2) {
          return resolve(true);
        } else {
          return reject(false);
        }
      };

      const handleLongTask = (entry: any) => {
        console.log("Long task entry", entry);
        performanceObserver.current?.disconnect();
        if (entry.duration < threshold) {
          return resolve(true);
        } else {
          return reject(false);
        }
      };

      performanceObserver.current = new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          switch (entry.entryType) {
            case "event":
              handleEvent(entry);
              break;
            case "longtask":
              handleLongTask(entry);
              break;
          }
        }
      });

      performanceObserver.current?.observe({ entryTypes: ["event", "longtask"] });
    });
  };

  const renderCursor = () => {
    isCursorVisible.current = true;
    const renderer = new Renderer({ dpr: 2, alpha: true });
    const gl = renderer.gl;
    gl.canvas.style.top = "0";
    gl.canvas.style.left = "0";
    gl.canvas.style.position = "fixed";
    gl.canvas.style.filter = "blur(14px)";
    gl.canvas.style.opacity = "0";
    gl.canvas.style.transition = "opacity 0.5s ease-in-out";
    // gl.canvas.style.zIndex = '-1';

    document.getElementById("cursor-container")?.appendChild(gl.canvas);

    setTimeout(() => {
      gl.clearColor(0, 0, 0, 0);
      gl.canvas.style.opacity = "1";
    }, 500);

    const scene = new Transform();

    const lines: any[] = [];

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);

      // We call resize on the polylines to update their resolution uniforms
      lines.forEach((line) => line.polyline.resize());
    }
    window.addEventListener("resize", resize, false);

    // Just a helper function to make the code neater
    function random(a: any, b: any) {
      const alpha = Math.random();
      return a * (1.0 - alpha) + b * alpha;
    }

    // If you're interested in learning about drawing lines with geometry,
    // go through this detailed article by Matt DesLauriers
    // https://mattdesl.svbtle.com/drawing-lines-is-hard
    // It's an excellent breakdown of the approaches and their pitfalls.

    // In this example, we're making screen-space polylines. Basically it
    // involves creating a geometry of vertices along a path - with two vertices
    // at each point. Then in the vertex shader, we push each pair apart to
    // give the line some width.

    // We're going to make a number of different coloured lines for fun.
    // Green, Blue, Magenta
    // ['#67E646', '#0009E7', '#FF005C'].forEach((color, i) => {
    // Green, Purple, Magenta
    // ['#67E646', '#7946E6', '#FF005C'].forEach((color, i) => {
    // DarkGreen, Blue, Green
    // ['#26BA3F', '#0009E7', '#67E646'].forEach((color, i) => {
    // Lila, Blue, Green
    ["#F91690", "#0009E7", "#67E646"].forEach((color, i) => {
      // Store a few values for each lines' spring movement
      const line = {
        spring: random(0.02, 0.1),
        friction: random(0.8, 0.95),
        mouseVelocity: new Vec3(),
        mouseOffset: new Vec3(random(-1, 1) * 0.02),
        points: [],
        polyline: "",
      };

      // Create an array of Vec3s (eg [[0, 0, 0], ...])
      // Note: Only pass in one for each point on the line - the class will handle
      // the doubling of vertices for the polyline effect.
      const count = 20;
      const points = (line["points"] = []);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      for (let i = 0; i < count; i++) points.push(new Vec3());

      // Pass in the points, and any custom elements - for example here we've made
      // custom shaders, and accompanying uniforms.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      line["polyline"] = new Polyline(gl, {
        points,
        vertex: vertex,
        uniforms: {
          uColor: { value: new Color(color) },
          uThickness: { value: random(20, 50) },
        },
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      line["polyline"].mesh.setParent(scene);

      lines.push(line);
    });

    // Call initial resize after creating the polylines
    resize();

    // Add handlers to get mouse position
    const mouse = new Vec3();
    if ("ontouchstart" in window) {
      window.addEventListener("touchstart", updateMouse, false);
      window.addEventListener("touchmove", updateMouse, false);
    } else {
      window.addEventListener("mousemove", updateMouse, false);
    }

    function updateMouse(e: any) {
      if (e.changedTouches && e.changedTouches.length) {
        e.x = e.changedTouches[0].pageX;
        e.y = e.changedTouches[0].pageY;
      }
      if (e.x === undefined) {
        e.x = e.pageX;
        e.y = e.pageY;
      }

      // Get mouse value in -1 to 1 range, with y flipped
      mouse.set((e.x / gl.renderer.width) * 2 - 1, (e.y / gl.renderer.height) * -2 + 1, 0);
    }

    const tmp = new Vec3();

    requestAnimationFrame(update);
    // let lastLoop = Date.now();

    function update(t: any) {
      // let thisLoop = Date.now();
      // let fps = 1000 / (thisLoop - lastLoop);
      // lastLoop = thisLoop;
      // console.log("FPS: ", fps);

      requestAnimationFrame(update);

      lines.forEach((line) => {
        // Update polyline input points
        for (let i = line.points.length - 1; i >= 0; i--) {
          if (!i) {
            // For the first point, spring ease it to the mouse position
            tmp.copy(mouse).add(line.mouseOffset).sub(line.points[i]).multiply(line.spring);
            line.mouseVelocity.add(tmp).multiply(line.friction);
            line.points[i].add(line.mouseVelocity);
          } else {
            // The rest of the points ease to the point in front of them, making a line
            line.points[i].lerp(line.points[i - 1], 0.9);
          }
        }
        line.polyline.updateGeometry();
      });

      renderer.render({ scene });
    }
  };

  return <div id="cursor-container"></div>;
};

export default CustomCursor;
