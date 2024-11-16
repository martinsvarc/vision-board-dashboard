import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Palette, Upload } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getVisionItems, saveVisionItem, updateVisionItem, deleteVisionItem } from '@/api/vision-board';

interface VisionItem {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  aspectRatio: number;
}

function ColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [hue, setHue] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setPosition({ x, y });
      const newColor = `hsl(${hue}, ${x * 100}%, ${100 - y * 100}%)`;
      onChange(newColor);
    }
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    setHue(newHue);
    const newColor = `hsl(${newHue}, ${position.x * 100}%, ${100 - position.y * 100}%)`;
    onChange(newColor);
  };

  return (
    <div className="p-4 w-64 space-y-4">
      <div
        ref={pickerRef}
        className="w-full h-40 rounded-lg cursor-crosshair relative"
        style={{
          background: `linear-gradient(to bottom, white, transparent),
                      linear-gradient(to right, transparent, hsl(${hue}, 100%, 50%))`,
          backgroundColor: 'black'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => e.buttons === 1 && handleMouseDown(e)}
      >
        <div
          className="w-4 h-4 rounded-full border-2 border-white absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${position.x * 100}%`,
            top: `${position.y * 100}%`,
            backgroundColor: color
          }}
        />
      </div>
      <input
        type="range"
        min="0"
        max="360"
        value={hue}
        onChange={handleHueChange}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-[#fbb350] via-[#51c1a9] to-[#556bc7]"
      />
    </div>
  );
}

export default function VisionBoard() {
  const { user } = useAuth();
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(0);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [interactionType, setInteractionType] = useState<'move' | 'resize' | null>(null);
  const [interactionStart, setInteractionStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [glowColor, setGlowColor] = useState('rgba(85, 107, 199, 0.3)');
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      getVisionItems(user.id).then(items => {
        setVisionItems(items);
        const maxZ = Math.max(...items.map(item => item.zIndex), 0);
        setMaxZIndex(maxZ);
      });
    }
  }, [user?.id]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id || !event.target.files || !boardRef.current) return;

    const files = event.target.files;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          const aspectRatio = img.width / img.height;
          const height = 300;
          const width = height * aspectRatio;
          const board = boardRef.current!.getBoundingClientRect();
          
          const maxX = board.width - width;
          const maxY = board.height - height;
          const x = Math.min(Math.max(0, Math.random() * maxX), maxX);
          const y = Math.min(Math.max(0, Math.random() * maxY), maxY);
          
          const newItem = await saveVisionItem(user.id, {
            src: e.target?.result as string,
            x,
            y,
            width,
            height,
            zIndex: maxZIndex + 1,
            aspectRatio
          });

          setVisionItems(prev => [...prev, newItem]);
          setMaxZIndex(prev => prev + 1);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxZIndex, user?.id]);

  const updateItemPosition = useCallback(async (id: string, deltaX: number, deltaY: number) => {
    if (!user?.id) return;

    setVisionItems(prev => prev.map(item => {
      if (item.id === id && boardRef.current) {
        const board = boardRef.current.getBoundingClientRect();
        const newX = Math.min(Math.max(0, item.x + deltaX), board.width - item.width);
        const newY = Math.min(Math.max(0, item.y + deltaY), board.height - item.height);
        return { ...item, x: newX, y: newY };
      }
      return item;
    }));

    const item = visionItems.find(item => item.id === id);
    if (item) {
      await updateVisionItem(id, user.id, {
        x: item.x,
        y: item.y
      });
    }
  }, [user?.id, visionItems]);

  const updateItemSize = useCallback(async (id: string, deltaWidth: number, deltaHeight: number, direction: string) => {
    if (!user?.id) return;

    setVisionItems(prev => prev.map(item => {
      if (item.id === id && boardRef.current) {
        const board = boardRef.current.getBoundingClientRect();
        let newWidth = item.width;
        let newHeight = item.height;
        let newX = item.x;
        let newY = item.y;

        if (direction.includes('right')) {
          newWidth = Math.min(Math.max(100, item.width + deltaWidth), board.width - item.x);
        } else if (direction.includes('left')) {
          const potentialWidth = Math.min(Math.max(100, item.width - deltaWidth), item.x + item.width);
          newX = item.x + (item.width - potentialWidth);
          newWidth = potentialWidth;
        }

        if (direction.includes('bottom')) {
          newHeight = Math.min(Math.max(100, item.height + deltaHeight), board.height - item.y);
        } else if (direction.includes('top')) {
          const potentialHeight = Math.min(Math.max(100, item.height - deltaHeight), item.y + item.height);
          newY = item.y + (item.height - potentialHeight);
          newHeight = potentialHeight;
        }

        const aspectRatio = item.aspectRatio;
        if (newWidth / newHeight > aspectRatio) {
          newWidth = newHeight * aspectRatio;
        } else {
          newHeight = newWidth / aspectRatio;
        }

        return { ...item, width: newWidth, height: newHeight, x: newX, y: newY };
      }
      return item;
    }));

    const item = visionItems.find(item => item.id === id);
    if (item) {
      await updateVisionItem(id, user.id, {
        width: item.width,
        height: item.height,
        x: item.x,
        y: item.y
      });
    }
  }, [user?.id, visionItems]);

  const bringToFront = useCallback(async (id: string) => {
    if (!user?.id) return;

    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    setVisionItems(prev => prev.map(item => 
      item.id === id ? { ...item, zIndex: newZIndex } : item
    ));

    await updateVisionItem(id, user.id, { zIndex: newZIndex });
  }, [maxZIndex, user?.id]);

  const handleDelete = useCallback(async (id: string) => {
    if (!user?.id) return;

    setVisionItems(prev => prev.filter(item => item.id !== id));
    await deleteVisionItem(id, user.id);
  }, [user?.id]);

  const handleInteractionStart = useCallback((event: React.MouseEvent, id: string, type: 'move' | 'resize', direction?: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    setActiveItem(id);
    setInteractionType(type);
    setInteractionStart({ x: event.clientX, y: event.clientY });
    if (type === 'resize' && direction) {
      setResizeDirection(direction);
    }
    bringToFront(id);
  }, [bringToFront]);

  const handleInteractionMove = useCallback((event: React.MouseEvent) => {
    if (!activeItem || !interactionStart) return;

    const deltaX = event.clientX - interactionStart.x;
    const deltaY = event.clientY - interactionStart.y;

    if (interactionType === 'move') {
      updateItemPosition(activeItem, deltaX, deltaY);
    } else if (interactionType === 'resize' && resizeDirection) {
      updateItemSize(activeItem, deltaX, deltaY, resizeDirection);
    }

    setInteractionStart({ x: event.clientX, y: event.clientY });
  }, [activeItem, interactionStart, interactionType, resizeDirection, updateItemPosition, updateItemSize]);

  const handleInteractionEnd = useCallback(() => {
    setActiveItem(null);
    setInteractionType(null);
    setInteractionStart(null);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleInteractionEnd();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleInteractionEnd]);

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 bg-white rounded-2xl shadow-sm mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#556bc7]">Interactive Vision Board</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="bg-[#fbb350] hover:bg-[#f9a238] text-white border-[#fbb350] gap-2 rounded-xl h-9 px-3 sm:h-10 sm:px-4"
              >
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <ColorPicker color={glowColor} onChange={setGlowColor} />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="lg"
            className="bg-[#51c1a9] hover:bg-[#45a892] text-white border-[#51c1a9] gap-2 rounded-xl h-9 px-3 sm:h-10 sm:px-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add Vision</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </header>
      <main className="flex-grow relative">
        <div 
          ref={boardRef} 
          className="absolute inset-0 rounded-2xl bg-white shadow-lg border transition-all duration-300"
          style={{
            borderColor: glowColor,
            boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor.replace('0.3', '0.2')}`
          }}
          onMouseMove={handleInteractionMove}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
        >
          <div className="absolute inset-0 overflow-hidden">
            {visionItems.map((item) => (
              <div
                key={item.id}
                className="absolute cursor-move group select-none"
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                  zIndex: item.zIndex,
                }}
                onMouseDown={(e) => handleInteractionStart(e, item.id, 'move')}
              >
                <div 
                  className="relative w-full h-full rounded-2xl overflow-hidden border shadow-lg transition-all duration-300"
                  style={{
                    borderColor: glowColor,
                    boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor.replace('0.3', '0.2')}`
                  }}
                >
                  <img 
                    src={item.src} 
                    alt="Vision Item" 
                    className="w-full h-full object-cover select-none" 
                    draggable="false"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#fbb350] hover:bg-[#f9a238] text-white h-8 w-8"
                    onClick={() => handleDelete(item.id)}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM7 3h10M9 3v3M15 3v3M9 14v-4M15 14v-4" />
                    </svg>
                  </Button>
                  <div className="resize-handle resize-handle-tl" onMouseDown={(e) => handleInteractionStart(e, item.id, 'resize', 'top-left')} />
                  <div className="resize-handle resize-handle-tr" onMouseDown={(e) => handleInteractionStart(e, item.id, 'resize', 'top-right')} />
                  <div className="resize-handle resize-handle-bl" onMouseDown={(e) => handleInteractionStart(e, item.id, 'resize', 'bottom-left')} />
                  <div className="resize-handle resize-handle-br" onMouseDown={(e) => handleInteractionStart(e, item.id, 'resize', 'bottom-right')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <style>{`
        .resize-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 20px;
          touch-action: none;
        }
        .resize-handle-tl { top: -10px; left: -10px; cursor: nwse-resize; }
        .resize-handle-tr { top: -10px; right: -10px; cursor: nesw-resize; }
        .resize-handle-bl { bottom: -10px; left: -10px; cursor: nesw-resize; }
        .resize-handle-br { bottom: -10px; right: -10px; cursor: nwse-resize; }
        
        @media (max-width: 640px) {
          .resize-handle {
            width: 24px;
            height: 24px;
          }
          .resize-handle-tl { top: -12px; left: -12px; }
          .resize-handle-tr { top: -12px; right: -12px; }
          .resize-handle-bl { bottom: -12px; left: -12px; }
          .resize-handle-br { bottom: -12px; right: -12px; }
        }
      `}</style>
    </div>
  );
}
