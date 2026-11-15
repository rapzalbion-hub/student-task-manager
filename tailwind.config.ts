import type { Config } from "tailwindcss";
const f = ["Plus Jakarta Sans", "sans-serif"];
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {"background":"#f8f9ff","surface":"#f8f9ff","surface-dim":"#cbdbf5","surface-bright":"#f8f9ff","surface-container-lowest":"#ffffff","surface-container-low":"#eff4ff","surface-container":"#e5eeff","surface-container-high":"#dce9ff","surface-container-highest":"#d3e4fe","surface-variant":"#d3e4fe","on-surface":"#0b1c30","on-background":"#0b1c30","on-surface-variant":"#434655","inverse-surface":"#213145","inverse-on-surface":"#eaf1ff","outline":"#737686","outline-variant":"#c3c6d7","surface-tint":"#0053db","primary":"#004ac6","on-primary":"#ffffff","primary-container":"#2563eb","on-primary-container":"#eeefff","inverse-primary":"#b4c5ff","primary-fixed":"#dbe1ff","primary-fixed-dim":"#b4c5ff","secondary":"#565e74","on-secondary":"#ffffff","secondary-container":"#dae2fd","on-secondary-container":"#5c647a","tertiary":"#006242","on-tertiary":"#ffffff","tertiary-container":"#007d55","on-tertiary-container":"#bdffdb","tertiary-fixed":"#6ffbbe","tertiary-fixed-dim":"#4edea3","error":"#ba1a1a","on-error":"#ffffff","error-container":"#ffdad6","on-error-container":"#93000a"},
    borderRadius: {DEFAULT:"0.25rem",lg:"0.5rem",xl:"0.75rem","2xl":"1rem",full:"9999px"},
    spacing: {"space-2xs":"0.25rem","space-xs":"0.5rem","space-sm":"0.75rem","space-md":"1rem","space-lg":"1.5rem","space-xl":"2rem","space-2xl":"3rem",gutter:"1.25rem","gutter-sm":"0.75rem",margin:"2rem","margin-mobile":"1rem"},
    fontFamily: {sans:f,"display-lg":f,"headline-lg":f,"headline-md":f,"title-md":f,"body-lg":f,"body-md":f,"body-sm":f,"label-md":f,"label-sm":f},
    fontSize: {
      "display-lg":["32px",{lineHeight:"40px",letterSpacing:"-0.02em",fontWeight:"700"}],
      "headline-lg":["24px",{lineHeight:"32px",letterSpacing:"-0.015em",fontWeight:"700"}],
      "headline-lg-mobile":["20px",{lineHeight:"28px",letterSpacing:"-0.01em",fontWeight:"700"}],
      "headline-md":["18px",{lineHeight:"24px",letterSpacing:"-0.01em",fontWeight:"600"}],
      "title-md":["16px",{lineHeight:"22px",fontWeight:"600"}],
      "body-lg":["15px",{lineHeight:"24px",fontWeight:"400"}],
      "body-md":["14px",{lineHeight:"20px",fontWeight:"400"}],
      "body-sm":["13px",{lineHeight:"18px",fontWeight:"400"}],
      "label-md":["13px",{lineHeight:"16px",letterSpacing:"0.01em",fontWeight:"600"}],
      "label-sm":["11px",{lineHeight:"14px",letterSpacing:"0.04em",fontWeight:"600"}]},
    boxShadow: {card:"0 1px 3px 0 rgba(15,23,42,.04),0 1px 2px -1px rgba(15,23,42,.04)",hover:"0 4px 6px -1px rgba(15,23,42,.07),0 2px 4px -2px rgba(15,23,42,.05)",modal:"0 20px 25px -5px rgba(15,23,42,.1),0 8px 10px -6px rgba(15,23,42,.04)"}
  }},
  plugins: [],
} satisfies Config;
