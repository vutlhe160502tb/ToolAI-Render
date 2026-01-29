"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type BeamOptions = {
  initialX?: number;
  translateX?: number;
  initialY?: number;
  translateY?: number;
  rotate?: number;
  className?: string;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
};

export const BackgroundBeamsWithCollision = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const beams: BeamOptions[] = [
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" },
    { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" },
    { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" },
    { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
  ];

  return (
    <div
      ref={parentRef}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-neutral-950",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0 z-0">
        {beams.map((beam, idx) => (
          <CollisionMechanism
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            parentRef={parentRef}
            containerRef={containerRef}
            beamOptions={beam}
          />
        ))}
      </div>

      <div className="relative z-20">{children}</div>
    </div>
  );
};

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement | null>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    beamOptions?: BeamOptions;
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement | null>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({ detected: false, coordinates: null });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        // When the beam reaches the top of container area, trigger "collision"
        if (beamRect.bottom >= containerRect.top) {
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;

          setCollision({
            detected: true,
            coordinates: { x: relativeX, y: relativeY },
          });
          setCycleCollisionDetected(true);
        }
      }
    };

    const interval = window.setInterval(checkCollision, 50);
    return () => window.clearInterval(interval);
  }, [cycleCollisionDetected, containerRef, parentRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      const t1 = window.setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
      }, 2000);

      const t2 = window.setTimeout(() => {
        setBeamKey((k) => k + 1);
      }, 2000);

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [collision]);

  const {
    initialX = 0,
    translateX = 0,
    initialY = "-200px",
    translateY = "1800px",
    rotate = 0,
    className,
    duration = 8,
    delay = 0,
    repeatDelay = 0,
  } = beamOptions;

  return (
    <>
      <motion.div
        key={beamKey}
        ref={(node) => {
          beamRef.current = node;
          if (typeof ref === "function") ref(node as unknown as HTMLDivElement);
        }}
        initial={{
          translateX: initialX,
          translateY: initialY,
          rotate,
          opacity: 0,
        }}
        animate={{
          translateX,
          translateY,
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          repeatDelay,
          ease: "linear",
        }}
        className={cn(
          "absolute left-0 top-0 h-40 w-[2px] bg-gradient-to-b from-transparent via-indigo-500 to-transparent blur-[0.5px]",
          className,
        )}
        style={{ willChange: "transform" }}
      />

      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            style={{
              left: collision.coordinates.x,
              top: collision.coordinates.y,
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
});

CollisionMechanism.displayName = "CollisionMechanism";

const Explosion = ({ className, ...props }: React.HTMLProps<HTMLDivElement>) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <motion.div
      {...props}
      className={cn("absolute z-10 h-0 w-0", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {spans.map((span) => (
        <motion.span
          key={span.id}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
          initial={{ x: span.initialX, y: span.initialY, opacity: 1, scale: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
            scale: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
};

