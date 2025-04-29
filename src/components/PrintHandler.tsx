import React, { useRef, useEffect } from "react";

interface PrintHandlerProps {
  content: string;
  trigger: boolean;
  onPrintComplete?: () => void;
}

const PrintHandler: React.FC<
  PrintHandlerProps
> = ({ content, trigger, onPrintComplete }) => {
  const iframeRef =
    useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (trigger && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentWindow?.document;

      if (iframeDoc) {
        // Clear existing content and write new content
        iframeDoc.open();
        iframeDoc.write(content);
        iframeDoc.close();

        // When iframe is loaded, print it
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Execute callback after print dialog is shown
            if (onPrintComplete) {
              // This won't detect when printing is complete, just when dialog shows
              setTimeout(onPrintComplete, 500);
            }
          } catch (err) {
            console.error(
              "Printing failed:",
              err
            );
          }
        };
      }
    }
  }, [content, trigger, onPrintComplete]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        width: "0",
        height: "0",
      }}
    />
  );
};

export default PrintHandler;
