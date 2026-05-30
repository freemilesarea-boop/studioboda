import { ImageResponse } from "next/og";

// Generated OG/social image (also used by Twitter when no twitter-image exists).
// Real 1200×630 PNG produced at request time — gives every shared link a
// branded preview without shipping a binary asset.
export const alt = "STUDIO BODA — AI와 전문가가 함께 완성하는 콘텐츠 제작 스튜디오";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A12",
          padding: "80px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              border: "6px solid #6E5BFF",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "0.18em",
            }}
          >
            STUDIO BODA
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            AI와 전문가가 함께 완성하는 콘텐츠 제작 스튜디오
          </div>
          <div style={{ fontSize: 30, color: "#C6C7D0" }}>
            상세페이지 · 광고 · SNS · 썸네일 · 브랜드 디자인
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#7C9CFF" }}>
          See it. Make it. Ship it tomorrow.
        </div>
      </div>
    ),
    { ...size },
  );
}
