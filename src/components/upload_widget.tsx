import { useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, MAX_FILE_SIZE } from "@/constant";
import type { UploadWidgetValue } from "@/type";

type UploadWidgetProps = {
  value: UploadWidgetValue | null;
  onChange: (value: UploadWidgetValue | null) => void;
  disabled?: boolean;
};

const hasCloudinaryConfig = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

function Upload_Widget({ value, onChange, disabled = false }: UploadWidgetProps) {
  const [preview, setPreview] = useState<UploadWidgetValue | null>(value);
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hasCloudinaryConfig) {
      return;
    }

    const initializeWidget = () => {
      if (!window.cloudinary || widgetRef.current) {
        return Boolean(widgetRef.current);
      }

      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          multiple: false,
          maxFileSize: MAX_FILE_SIZE,
          clientAllowedFormats: ["png", "jpg", "jpeg","webp"],
        
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload failed:", error);
            return;
          }

          if (result.event !== "success") {
            return;
          }

          const uploadedImage: UploadWidgetValue = {
            url: result.info.secure_url,
            publicId: result.info.public_id,
          };

          setPreview(uploadedImage);
          onChangeRef.current(uploadedImage);
        },
      );

      return true;
    };

    if (initializeWidget()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (initializeWidget()) {
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  const openWidget = () => {
    if (!disabled && hasCloudinaryConfig) {
      widgetRef.current?.open();
    }
  };

  return (
    <div className="space-y-2">
      {!hasCloudinaryConfig ? (
        <p role="status" className="text-sm text-muted-foreground">
          Image uploads are unavailable. Set VITE_CLOUDINARY_CLOUD_NAME and
          VITE_CLOUDINARY_UPLOAD_PRESET in the frontend .env file.
        </p>
      ) : preview ? (
        <div className="upload-preview">
          <img src={preview.url} alt="Uploaded image preview" />
        </div>
      ) : (
        <div
          className="upload-dropzone"
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={openWidget}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openWidget();
            }
          }}
        >
          <div className="upload-prompt">
            <UploadCloud className="icon" />
            <div>
              <p>Click or drag files to upload</p>
              <p>PNG or JPG, up to 3 MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload_Widget;
