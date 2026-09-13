import { permanentRedirect } from "next/navigation";

// The calendar experiment is retired. Existing order and download routes remain.
export default function ContentEnginePage() {
  permanentRedirect("/explore");
}
