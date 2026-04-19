import React from "react";
import { useMediaUrl, isVideo, isMov } from "@/hooks/useMediaUrl";

interface MediaRendererProps {
    src: string;
    mediaType?: string;
    className?: string;
    onClick?: () => void;
    /** Show a play button overlay instead of native controls */
    showPlayIcon?: boolean;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
    src,
    mediaType,
    className = "",
    onClick,
    showPlayIcon = false,
}) => {
    const isVid = isVideo(src, mediaType);

    // Only run HEIC conversion for images; videos go straight through
    const { url, loading, error } = useMediaUrl(isVid ? undefined : src);

    /* ── loading skeleton ── */
    if (loading) {
        return (
            <div
                className={`${className} bg-muted flex items-center justify-center rounded-xl`}
                style={{ minHeight: 80 }}
            >
                <span className="text-[11px] text-muted-foreground animate-pulse">
                    Converting…
                </span>
            </div>
        );
    }

    /* ── conversion failed — show placeholder ── */
    if (error) {
        return (
            <div
                className={`${className} bg-muted flex items-center justify-center rounded-xl`}
                style={{ minHeight: 80 }}
            >
                <span className="text-[11px] text-muted-foreground">
                    Cannot display image
                </span>
            </div>
        );
    }

    /* ── video (mp4 / mov / webm …) ── */
    if (isVid) {
        return (
            <div className={`${className} relative overflow-hidden`} onClick={onClick}>
                <video
                    className="w-full h-full object-cover"
                    playsInline
                    preload="metadata"
                    controls={!showPlayIcon}
                    muted={showPlayIcon}
                >
                    {/* QuickTime hint so Safari plays .mov inline */}
                    {isMov(src) && <source src={src} type="video/quicktime" />}
                    {/* Always add a generic fallback source */}
                    <source src={src} />
                    Your browser does not support this video.
                </video>

                {showPlayIcon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                            {/* Simple play triangle — no external dep */}
                            <svg
                                width="18" height="18" viewBox="0 0 24 24"
                                fill="white" xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* ── image (jpg / png / webp / heic→jpeg …) ── */
    return (
        <img
            src={url}
            alt=""
            className={`${className} object-cover`}
            onClick={onClick}
            draggable={false}
        />
    );
};

export default MediaRenderer;