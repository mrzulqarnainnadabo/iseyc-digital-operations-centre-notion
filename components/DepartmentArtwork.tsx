import type { Department } from "@/lib/departments";

export function DepartmentArtwork({ slug }: { slug: Department["slug"] }) {
  return (
    <svg className="department-artwork" viewBox="0 0 320 190" role="img" aria-label={
      slug === "education" ? "Open book symbol" :
      slug === "health" ? "Healthcare and wellbeing symbol" :
      slug === "technology" ? "Connected technology symbol" : "Civic institution symbol"
    }>
      <circle className="artwork-orbit" cx="160" cy="94" r="76" />
      <circle className="artwork-orbit artwork-orbit--inner" cx="160" cy="94" r="54" />
      {slug === "education" && <g className="artwork-symbol"><path d="M86 72 Q122 52 158 72 V130 Q122 110 86 130 Z"/><path d="M158 72 Q194 52 230 72 V130 Q194 110 158 130 Z"/><path d="M158 72 V130"/><path d="M105 86 Q128 78 143 87 M105 101 Q128 93 143 102 M173 87 Q196 78 214 86 M173 102 Q196 93 214 101"/></g>}
      {slug === "health" && <g className="artwork-symbol"><path d="M160 48 C135 25 94 44 94 80 C94 113 128 137 160 157 C192 137 226 113 226 80 C226 44 185 25 160 48 Z"/><path d="M107 94 H139 L151 72 L170 116 L184 91 H213"/></g>}
      {slug === "technology" && <g className="artwork-symbol"><rect x="111" y="48" width="98" height="92" rx="13"/><path d="M129 73 H191 M129 91 H178 M129 109 H164"/><circle cx="160" cy="31" r="7"/><circle cx="90" cy="94" r="7"/><circle cx="230" cy="94" r="7"/><path d="M160 38 V48 M97 94 H111 M209 94 H223"/></g>}
      {slug === "civic" && <g className="artwork-symbol"><path d="M91 75 L160 37 L229 75 Z"/><path d="M101 83 H219 M108 83 V137 M143 83 V137 M177 83 V137 M212 83 V137 M94 145 H226 M86 155 H234"/><path d="M160 37 V23"/></g>}
      <circle className="artwork-dot" cx="62" cy="43" r="5"/><circle className="artwork-dot" cx="254" cy="139" r="4"/>
    </svg>
  );
}
