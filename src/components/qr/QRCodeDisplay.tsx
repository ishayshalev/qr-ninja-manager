import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  id: string;
  redirectUrl: string;
}

export const QRCodeDisplay = ({ id, redirectUrl }: QRCodeDisplayProps) => {
  return (
    <div className="flex justify-center mb-4">
      <QRCodeCanvas
        id={id}
        value={redirectUrl}
        size={200}
        level="H"
        includeMargin
      />
      <div className="hidden">
        <QRCodeSVG
          id={`${id}-svg`}
          value={redirectUrl}
          size={200}
          level="H"
          includeMargin
        />
      </div>
    </div>
  );
};