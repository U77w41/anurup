/**
 * All user-facing tool copy and SEO metadata in one place.
 *
 * Pure data (no React imports) so it can be used both by the app and by the
 * build-time prerender plugin that writes one static HTML page per tool.
 */

export const SITE = {
  name: "ANURUP",
  /** Public URL of the deployed app, with trailing slash. Change this if you move to a custom domain. */
  url: "https://u77w41.github.io/anurup/",
  repo: "https://github.com/U77w41/anurup",
  author: "Ujjwal Chowdhury",
  authorUrl: "https://u77w41.github.io/",
  ogImage: "og-image.png",
  locale: "en_IN",
} as const;

export type ToolId =
  | "passport-photo"
  | "size-targeter"
  | "image-compressor"
  | "crop-rotate"
  | "background-removal"
  | "signature-cleaner"
  | "format-converter"
  | "pdf-viewer"
  | "image-to-pdf"
  | "pdf-merger"
  | "pdf-splitter"
  | "pdf-page-manager"
  | "pdf-compressor"
  | "pdf-to-images"
  | "pdf-stamp"
  | "pdf-sign"
  | "pdf-unlock";

export interface Faq {
  q: string;
  a: string;
}

export interface ToolContent {
  id: ToolId;
  /** Name on cards and in menus. */
  name: string;
  /** Short label for "Continue with" buttons. */
  short: string;
  category: "photo" | "pdf";
  badge: "Photo" | "PDF" | "Convert";
  accepts: "image" | "pdf";
  multiple: boolean;
  /** Extra search terms for the home page search box. */
  keywords: string;
  /** One-line summary on the tool card. */
  card: string;
  /** <title> without the brand suffix (keep under ~50 characters). */
  title: string;
  /** Meta description (keep under ~160 characters). */
  description: string;
  h1: string;
  intro: string;
  howTo: string;
  steps: string[];
  faq: Faq[];
}

export const HOME = {
  title: "ANURUP | Free photo and PDF tools for online forms",
  description:
    "Resize photos to exact KB, make passport size photos, clean signatures, and merge, compress or unlock PDFs. Free, no sign-up, and files stay in your browser.",
  h1: "Photo and PDF tools for online form uploads",
  intro:
    "Exam, job, visa and KYC portals reject files for small reasons: the photo is 80 KB instead of 50, the signature is the wrong size, the PDF is over the limit. ANURUP fixes these in your browser. Nothing is uploaded and there is no account to create.",
};

export const TOOL_CONTENT: ToolContent[] = [
  {
    id: "passport-photo",
    name: "Passport Size Photo Maker",
    short: "Passport photo",
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "passport size photo visa id photo 35x45 2x2 3.5x4.5 cm print sheet 4x6",
    card: "Crop a photo to 35×45 mm, 2×2 inch and other sizes, set the background and DPI, and print a 4×6 sheet.",
    title: "Passport Size Photo Maker (35×45 mm, 2×2 in)",
    description:
      "Make a passport size photo in 35×45 mm, 2×2 inch or 33×48 mm. Set a white or blue background and 300 DPI, and print copies on a 4×6 inch sheet.",
    h1: "Passport size photo maker",
    intro:
      "Pick a size, drag the photo until the face sits inside the oval, and download a JPG at 300 DPI. You can also get a 4×6 inch or A4 sheet with several copies to print at a photo shop.",
    howTo: "How to make a passport size photo",
    steps: [
      "Upload a clear, front-facing photo.",
      "Choose a size, for example 35×45 mm (used in India, the UK and Schengen visas) or 2×2 inch (US).",
      "Drag and zoom until the head fits the oval guide, then pick a background colour.",
      "Download the photo, or turn on the printable sheet if you need prints.",
    ],
    faq: [
      {
        q: "What is 35×45 mm in pixels?",
        a: "At 300 DPI it is 413×531 pixels. Change the DPI box and the pixel size updates with it.",
      },
      {
        q: "The form also has a KB limit. What do I do?",
        a: "After generating the photo, click Continue with → Resize to size & KB. It keeps the dimensions and brings the file under the limit.",
      },
      {
        q: "How do I print passport photos at home?",
        a: "Turn on the 4×6 inch sheet, download it and print at 100% scale on 4×6 photo paper. Cut along the light grey lines.",
      },
    ],
  },
  {
    id: "size-targeter",
    name: "Resize Image to KB & Pixels",
    short: "Resize to size & KB",
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "resize photo 20kb 50kb 100kb kb dimensions pixels cm dpi signature upload portal",
    card: "Set exact pixels, cm or mm at a DPI, then keep the file between a minimum and maximum KB. Made for photo and signature uploads.",
    title: "Resize Image to 20 KB, 50 KB or Exact Pixels",
    description:
      "Resize a photo or signature to exact pixels or cm and a file size in KB, like 200×230 px under 50 KB. Supports a minimum KB too. Free and runs in your browser.",
    h1: "Resize image to exact size and KB",
    intro:
      "Most application forms give two limits: the dimensions (say 200×230 pixels or 3.5×4.5 cm) and a file size range (say 20 to 50 KB). Enter both here and you get a JPG that meets them, with the DPI written into the file.",
    howTo: "How to resize a photo to a KB limit",
    steps: [
      "Upload your photo, signature or scanned document.",
      "Enter the width and height in pixels, cm, mm or inches, and the DPI.",
      "Choose what happens if the shape is different: crop, pad with white, or stretch.",
      "Enter the maximum KB, and the minimum KB if the form has one, then click Resize & compress.",
    ],
    faq: [
      {
        q: "How do I reduce a photo to 20 KB?",
        a: "Set Max size to 20 and keep the dimensions the form asks for. ANURUP picks the highest JPG quality that still fits under 20 KB.",
      },
      {
        q: "The form says my file is too small. Now what?",
        a: "Fill in Min size. ANURUP pads the JPG with empty comment data to reach it, so the picture itself does not change.",
      },
      {
        q: "How do I set the DPI to 200?",
        a: "Type 200 in the DPI box. The value is written into the JPG header, which is what upload checkers read.",
      },
    ],
  },
  {
    id: "image-compressor",
    name: "Compress Image to KB",
    short: "Compress image",
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: true,
    keywords: "compress image photo jpg png webp reduce size kb mb 100kb 50kb optimize batch",
    card: "Shrink JPG, PNG or WebP photos to a target like 100 KB, or by quality. Works on many images at once.",
    title: "Compress Image to 100 KB, 50 KB or Less",
    description:
      "Compress JPG, PNG and WebP images to a target size in KB, or pick a quality level. Batch support and ZIP download, with no upload: it all runs in your browser.",
    h1: "Compress image to a target size in KB",
    intro:
      "Type the largest file size you can upload and ANURUP finds the best quality that fits. If quality alone is not enough, it can also shrink the dimensions a little at a time until the file fits.",
    howTo: "How to compress an image to a specific size",
    steps: [
      "Add one or more images.",
      "Choose Target size and enter the limit in KB, or choose Quality level.",
      "Pick the output format. JPG is the safest choice for upload forms.",
      "Download each file, or all of them as a ZIP.",
    ],
    faq: [
      {
        q: "Will compressing change the image dimensions?",
        a: "Only if you allow it and the KB target can't be reached by lowering quality. Otherwise the width and height stay the same.",
      },
      {
        q: "Why is my PNG still large?",
        a: "PNG is lossless, so quality settings don't apply to it. Convert it to JPG or WebP for a much smaller file.",
      },
    ],
  },
  {
    id: "crop-rotate",
    name: "Crop, Rotate & Flip Image",
    short: "Crop / rotate",
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "crop image photo rotate flip mirror aspect ratio square 1:1 trim",
    card: "Crop freely or to a ratio like 1:1 or 35×45 mm, rotate by 90° and mirror. Works with a mouse or touch.",
    title: "Crop, Rotate & Flip Image Online",
    description:
      "Crop an image freely or to a fixed ratio (1:1, 3:4, 35×45 mm), rotate it by 90° and flip or mirror it. Free, no sign-up, and the photo stays on your device.",
    h1: "Crop, rotate and flip an image",
    intro:
      "Drag a box over the part you want to keep, or pick a ratio and move the box around. Fix a sideways phone photo in one click, then send the result to the compressor or the KB resizer.",
    howTo: "How to crop and rotate a photo",
    steps: [
      "Upload a JPG, PNG or WebP image.",
      "Rotate or mirror it first if it is sideways or reversed.",
      "Drag on the image to draw a crop box, or choose a ratio. Use the corner handles to adjust it.",
      "Click Crop image, then download or continue in another tool.",
    ],
    faq: [
      {
        q: "How do I crop a photo for a 3.5×4.5 cm frame?",
        a: "Choose the 35×45 mm ratio. The box keeps that shape while you move and resize it.",
      },
      {
        q: "Does cropping reduce quality?",
        a: "No. The crop is taken from the full-resolution image and saved at high quality in the original format.",
      },
    ],
  },
  {
    id: "background-removal",
    name: "Remove Image Background",
    short: "Remove background",
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "remove background photo white background blue background transparent png cutout",
    card: "Remove a photo's background with on-device AI and replace it with white, blue, any colour or transparency.",
    title: "Remove Background from Photo (White or Blue)",
    description:
      "Remove a photo's background and replace it with white, light blue, red or any colour, or keep it transparent. The AI runs in your browser, so nothing is uploaded.",
    h1: "Remove image background",
    intro:
      "Handy when a form wants a plain white or light blue background and your photo was taken against a wall or a window. The AI model downloads the first time you use it and then runs on your device.",
    howTo: "How to change a photo background to white",
    steps: [
      "Upload a portrait or product photo.",
      "Click Remove background and wait for the model to finish.",
      "Pick a background: white, light blue, red, a custom colour or transparent.",
      "Download it, or continue to the passport photo maker or the KB resizer.",
    ],
    faq: [
      {
        q: "Is my photo uploaded anywhere?",
        a: "No. The model files are downloaded from a CDN, but your photo is processed inside the browser.",
      },
      {
        q: "Can I change the colour after processing?",
        a: "Yes. The cut-out is kept, so switching between colours is instant.",
      },
    ],
  },
  {
    id: "signature-cleaner",
    name: "Signature Cleaner",
    short: "Clean signature",
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "signature scan sign photo clean white background transparent ink threshold crop",
    card: "Turn a phone photo of your signature into clean black or blue ink on white or transparent, trimmed to fit.",
    title: "Clean & Crop a Signature Photo for Online Forms",
    description:
      "Upload a phone photo of your signature and get clean black or blue ink on a white or transparent background, cropped tight. Then resize it to the KB the form needs.",
    h1: "Signature cleaner",
    intro:
      "Sign on plain white paper with a dark pen and take a photo. ANURUP evens out shadows, separates ink from paper and trims the empty margin.",
    howTo: "How to make a clean signature image for a form",
    steps: [
      "Upload the photo or scan of your signature.",
      "Choose the ink colour (black, blue or original) and the background (white JPG or transparent PNG).",
      "Move the threshold slider if thin strokes disappear or grey smudges stay.",
      "Download it, or continue to Resize to size & KB to match the form's limits.",
    ],
    faq: [
      {
        q: "What size should a signature image be?",
        a: "It depends on the form. A common request is about 140×60 pixels and 10-20 KB. Use the signature preset in Resize to size & KB and check it against your form.",
      },
    ],
  },
  {
    id: "format-converter",
    name: "JPG, PNG & WebP Converter",
    short: "Convert format",
    category: "photo",
    badge: "Convert",
    accepts: "image",
    multiple: true,
    keywords: "png to jpg jpg to png webp to jpg convert image format jpeg batch",
    card: "Convert images between JPG, PNG and WebP, one at a time or in a batch.",
    title: "Convert PNG to JPG, JPG to PNG and WebP",
    description:
      "Convert PNG to JPG, JPG to PNG, WebP to JPG and back. Batch convert, set the quality and download a ZIP. Free and private: images never leave your browser.",
    h1: "Convert JPG, PNG and WebP images",
    intro:
      "Many portals accept only JPG or JPEG. Drop in a PNG, WebP or screenshot and get a JPG back, with any transparent areas filled white.",
    howTo: "How to convert PNG to JPG",
    steps: [
      "Add one or more images.",
      "Pick the output format: JPG, PNG or WebP.",
      "Set the quality for JPG and WebP.",
      "Convert, then download the files one by one or as a ZIP.",
    ],
    faq: [
      {
        q: "Is JPEG the same as JPG?",
        a: "Yes. It is the same format, only the file extension is different.",
      },
    ],
  },
  {
    id: "pdf-viewer",
    name: "PDF Viewer",
    short: "View PDF",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "view pdf open pdf preview read pdf online",
    card: "Open a PDF and read it page by page with zoom, without uploading it anywhere.",
    title: "Online PDF Viewer (No Upload)",
    description:
      "View a PDF in your browser with page navigation, zoom and full screen. The file is opened locally and never uploaded. Send it to any PDF tool in one click.",
    h1: "PDF viewer",
    intro:
      "Check a PDF before you submit it: the page order, the scan quality, whether every page is there. From here you can send it to Compress, Merge, Split or Sign.",
    howTo: "How to check a PDF before uploading",
    steps: [
      "Open a PDF.",
      "Scroll through the pages, or type a page number.",
      "Zoom in or open full screen to read small text.",
      "Use Continue with to open it in another PDF tool.",
    ],
    faq: [
      {
        q: "Can it open a password-protected PDF?",
        a: "Remove the password with Remove PDF Password first, then open the unlocked copy here.",
      },
    ],
  },
  {
    id: "image-to-pdf",
    name: "JPG to PDF Converter",
    short: "Images → PDF",
    category: "pdf",
    badge: "Convert",
    accepts: "image",
    multiple: true,
    keywords: "jpg to pdf image to pdf png to pdf photos to pdf scan to pdf combine images",
    card: "Combine photos or scans into one PDF with A4, Letter or fit-to-image pages, margins and a file size setting.",
    title: "JPG to PDF: Combine Images into One PDF",
    description:
      "Convert JPG, PNG or scanned images to a single PDF. Reorder the pages, pick A4 or Letter, set margins and choose a small file size for uploads. Free and private.",
    h1: "JPG to PDF converter",
    intro:
      "Photograph each page of a certificate or marksheet, drop the photos in, and get one PDF. The Small file setting keeps it light enough for most upload limits.",
    howTo: "How to convert JPG to PDF",
    steps: [
      "Add the images in any order.",
      "Use the arrows to put the pages in the right order.",
      "Choose the page size, orientation, margin and image quality.",
      "Create the PDF, check the preview, then download it or compress it further.",
    ],
    faq: [
      {
        q: "How do I keep the PDF under 200 KB?",
        a: "Choose Small file. If it is still too big, click Continue with → Compress PDF and set a target size.",
      },
    ],
  },
  {
    id: "pdf-merger",
    name: "Merge PDF",
    short: "Merge PDFs",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: true,
    keywords: "merge pdf combine pdf join pdf files into one",
    card: "Join several PDFs into one, in the order you choose, with a preview of each file.",
    title: "Merge PDF Files Online (No Upload)",
    description:
      "Merge PDF files into one document. Reorder them, preview each one and download the combined PDF. Protected PDFs can be unlocked in place. Runs in your browser.",
    h1: "Merge PDF files",
    intro:
      "Forms often want a single PDF with the application, ID proof and certificates together. Add the files, set the order and merge.",
    howTo: "How to merge PDF files into one",
    steps: [
      "Add two or more PDFs.",
      "Use the arrows to set the order. Click the eye icon to preview a file.",
      "If a file shows Protected, click Unlock and enter its password.",
      "Click Merge and download the combined PDF.",
    ],
    faq: [
      {
        q: "Is there a limit on files or pages?",
        a: "There is no fixed limit. Very large files depend on your device's memory, because everything runs in the browser tab.",
      },
    ],
  },
  {
    id: "pdf-splitter",
    name: "Split PDF",
    short: "Split PDF",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "split pdf extract pages separate pdf pages range",
    card: "Pick pages from thumbnails or type ranges like 1-3, 5. Or split into single pages or equal chunks.",
    title: "Split PDF: Extract Pages or Split by Range",
    description:
      "Split a PDF by clicking page thumbnails or typing ranges like 1-3, 5, 8-. Extract pages into one file, or split every page or every N pages into separate PDFs.",
    h1: "Split PDF and extract pages",
    intro:
      "Pull out only the pages a form asks for, or break a long scan into smaller files. You pick from real page thumbnails, so you can see which page is which.",
    howTo: "How to extract pages from a PDF",
    steps: [
      "Open a PDF.",
      "Choose a mode: extract selected pages, every page separately, every N pages, or custom ranges.",
      "Click thumbnails to select pages (Shift+click selects a run), or type a range.",
      "Click Extract or Create PDFs, then download the files or a ZIP.",
    ],
    faq: [
      {
        q: "How do I write page ranges?",
        a: "Use commas and dashes. 1-3, 5, 8- means pages 1 to 3, page 5, and page 8 to the end.",
      },
    ],
  },
  {
    id: "pdf-page-manager",
    name: "Organize PDF Pages",
    short: "Organize pages",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "reorder pdf pages rearrange rotate pdf delete pdf pages page manager",
    card: "Reorder, rotate and delete PDF pages by dragging real page thumbnails.",
    title: "Rearrange, Rotate & Delete PDF Pages",
    description:
      "Reorder PDF pages by drag and drop, rotate pages that were scanned sideways and delete the ones you don't need. Free, private, and nothing is uploaded.",
    h1: "Organize PDF pages",
    intro:
      "Fix a scan that came out in the wrong order or with a page upside down. Every change shows on the thumbnails before you save.",
    howTo: "How to rearrange and rotate PDF pages",
    steps: [
      "Open a PDF.",
      "Drag thumbnails to reorder them, or use the arrow buttons on each page.",
      "Rotate single pages or all pages, and delete the ones you don't want.",
      "Click Save and download the new PDF.",
    ],
    faq: [
      {
        q: "Can I undo a deleted page?",
        a: "Yes. Deleted pages stay greyed out until you save. Click the restore button on the page, or Reset to start over.",
      },
    ],
  },
  {
    id: "pdf-compressor",
    name: "Compress PDF to KB",
    short: "Compress PDF",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "compress pdf reduce pdf size 100kb 200kb 500kb 1mb shrink pdf",
    card: "Shrink a PDF to a target like 200 KB or 500 KB, or use a lossless or preset level.",
    title: "Compress PDF to 100 KB, 200 KB or 500 KB",
    description:
      "Compress a PDF to a target size in KB, such as 100 KB or 500 KB, to meet upload limits. Lossless, Balanced and Strong modes, plus grayscale. Runs in your browser.",
    h1: "Compress PDF to a target size",
    intro:
      "Enter the upload limit and ANURUP finds the sharpest version of the PDF that fits under it. Lossless mode keeps text selectable. The other modes turn pages into images to get much smaller files.",
    howTo: "How to compress a PDF to a specific size",
    steps: [
      "Open the PDF.",
      "Choose Target size and type the limit in KB, or pick Lossless, Balanced or Strong.",
      "Turn on Grayscale for scanned forms if you need an even smaller file.",
      "Click Compress PDF, check the preview and download.",
    ],
    faq: [
      {
        q: "How do I compress a PDF to 100 KB?",
        a: "Choose Target size, type 100 and click Compress PDF. For long or colourful scans, turn on Grayscale as well.",
      },
      {
        q: "Why can't I select text after compressing?",
        a: "Balanced, Strong and Target size re-render each page as an image. Use Lossless if you need selectable text.",
      },
    ],
  },
  {
    id: "pdf-to-images",
    name: "PDF to JPG / PNG",
    short: "PDF → images",
    category: "pdf",
    badge: "Convert",
    accepts: "pdf",
    multiple: false,
    keywords: "pdf to jpg pdf to png pdf to image convert pdf page to photo 300 dpi",
    card: "Save PDF pages as JPG or PNG images at 72 to 300 DPI, one by one or as a ZIP.",
    title: "PDF to JPG Converter (Up to 300 DPI)",
    description:
      "Convert PDF pages to JPG or PNG images at 72, 150, 200 or 300 DPI. Choose the pages and download them one by one or as a ZIP. Free and runs in your browser.",
    h1: "Convert PDF to JPG or PNG",
    intro:
      "Some portals want an image, not a PDF. Export the page you need as a JPG, then compress or resize it in the next tool.",
    howTo: "How to convert a PDF page to JPG",
    steps: [
      "Open the PDF.",
      "Pick the resolution (DPI) and the format, JPG or PNG.",
      "Select the pages you want.",
      "Export, then download the images or a ZIP.",
    ],
    faq: [
      {
        q: "Which DPI should I choose?",
        a: "150 DPI is enough for on-screen use and most uploads. Pick 300 DPI if the image will be printed.",
      },
    ],
  },
  {
    id: "pdf-stamp",
    name: "Add Page Numbers & Watermark",
    short: "Page numbers / watermark",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "add page numbers to pdf watermark pdf stamp confidential draft",
    card: "Number every page and add a text watermark such as CONFIDENTIAL or your name.",
    title: "Add Page Numbers & Watermark to PDF",
    description:
      "Add page numbers to a PDF in six positions and four formats, skip the cover page, and stamp a diagonal or horizontal text watermark. Free and private.",
    h1: "Add page numbers and a watermark to a PDF",
    intro:
      "Number a long application bundle so no page gets lost, or mark copies with a watermark like COPY FOR VERIFICATION. Rotated pages come out the right way up.",
    howTo: "How to add page numbers to a PDF",
    steps: [
      "Open the PDF.",
      "Turn on Page numbers and choose the position, format and starting number.",
      "Turn on Text watermark if you want one, and set the text, opacity and size.",
      "Click Apply to all pages, check the preview and download.",
    ],
    faq: [
      {
        q: "Can I leave the first page without a number?",
        a: "Yes. Turn on Don't number the first page. Numbering then starts on page 2.",
      },
    ],
  },
  {
    id: "pdf-sign",
    name: "Sign & Fill PDF",
    short: "Sign / fill PDF",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "sign pdf add signature to pdf fill pdf add text date to pdf",
    card: "Place your signature or photo on a PDF and type names, dates or any text on the page.",
    title: "Sign PDF Online and Add Text or Date",
    description:
      "Add your signature image to a PDF and type text or today's date anywhere on a page. Drag to position and resize. No account and no upload: it runs in your browser.",
    h1: "Sign and fill a PDF",
    intro:
      "Use it for forms that need a signature and a date before you upload them. Clean the signature first with the Signature Cleaner to get a transparent background.",
    howTo: "How to add a signature to a PDF",
    steps: [
      "Open the PDF form.",
      "Upload your signature image, or pick one from the workspace.",
      "Drag it into place and resize it from the corner. Add text or today's date the same way.",
      "Click Save signed PDF and download.",
    ],
    faq: [
      {
        q: "Is this a digital signature?",
        a: "No. It places an image of your signature on the page, like signing a printout. It does not add a certificate-based digital signature.",
      },
    ],
  },
  {
    id: "pdf-unlock",
    name: "Remove PDF Password",
    short: "Unlock PDF",
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "remove pdf password unlock pdf decrypt protected secured pdf e-aadhaar bank statement",
    card: "Remove the open password or print and copy restrictions from a PDF you have the password for.",
    title: "Remove PDF Password (Unlock PDF)",
    description:
      "Unlock a password-protected PDF such as a bank statement or e-Aadhaar. Enter the password once and download a copy that opens without it. Nothing is uploaded.",
    h1: "Remove password from PDF",
    intro:
      "Bank statements, payslips and e-Aadhaar files often come password-protected, and many upload portals reject them. Enter the password once and get a normal PDF back. Text, links and quality stay the same, because the file is decrypted, not re-printed.",
    howTo: "How to remove a password from a PDF",
    steps: [
      "Open the protected PDF.",
      "Type the password you use to open it. The owner password works too.",
      "Click Remove password.",
      "Download the unlocked copy, or send it to Merge or Compress.",
    ],
    faq: [
      {
        q: "How is this different from Print → Save as PDF?",
        a: "Printing to PDF re-renders the pages and can lose selectable text, links and form fields. This removes the encryption and keeps everything else.",
      },
      {
        q: "Can it unlock a PDF if I don't know the password?",
        a: "No. You need the open password. PDFs that only block printing or copying unlock without one.",
      },
    ],
  },
];

export const TOOL_CONTENT_BY_ID: Record<ToolId, ToolContent> = Object.fromEntries(TOOL_CONTENT.map((t) => [t.id, t])) as Record<ToolId, ToolContent>;

export function toolUrl(id: ToolId): string {
  return `${SITE.url}${id}/`;
}
