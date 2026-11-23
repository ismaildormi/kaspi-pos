export interface SomInteractiveElement {
  markId: number;
  tag: "button" | "a" | "input" | "select" | "textarea";
  label: string;
  idAttr?: string;
  nameAttr?: string;
  inputType?: string;
  selector: string;
}

/**
 * Superpower #2 (`v95.0`): Set-of-Mark (SoM) Interactive GUI Operator (OmniParser / UI-TARS Pattern).
 * Indexes clickable & fillable elements cleanly so agents can operate web pages or UI previews deterministically.
 */
export function indexInteractiveElementsSetOfMark(html: string, maxMarks = 60) {
  const source = String(html || "");
  const elements: SomInteractiveElement[] = [];
  const elRe = /<(button|a|input|select|textarea)\b([^>]*)>([\s\S]*?)<\/\1>|<(input)\b([^>]*)\/?>/gi;

  let m: RegExpExecArray | null;
  let mark = 0;

  while ((m = elRe.exec(source)) !== null && mark < maxMarks) {
    const tag = ((m[1] || m[4] || "button").toLowerCase()) as SomInteractiveElement["tag"];
    const attrs = m[2] || m[5] || "";
    const innerText = (m[3] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);
    const ariaMatch = attrs.match(/\baria-label=["']([^"']+)["']/i);
    const placeholderMatch = attrs.match(/\bplaceholder=["']([^"']+)["']/i);
    const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);

    const idAttr = idMatch?.[1];
    const nameAttr = nameMatch?.[1];
    const label = (
      innerText ||
      ariaMatch?.[1] ||
      placeholderMatch?.[1] ||
      nameAttr ||
      idAttr ||
      tag
    ).slice(0, 80);

    const selector = idAttr
      ? `#${idAttr}`
      : nameAttr
      ? `${tag}[name="${nameAttr}"]`
      : `${tag}:nth-of-type(${mark + 1})`;

    mark++;
    elements.push({
      markId: mark,
      tag,
      label,
      ...(idAttr ? { idAttr } : {}),
      ...(nameAttr ? { nameAttr } : {}),
      ...(typeMatch?.[1] ? { inputType: typeMatch[1] } : {}),
      selector,
    });
  }

  return {
    ok: true,
    superpower: "vision_gui_som_operator_v95",
    totalMarkedElements: elements.length,
    elements,
  };
}
