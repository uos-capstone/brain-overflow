export interface MriResult {
  mriResultId: number;
  targetAge: number;
  resultFile: File;
}

export interface NiiFile {
  name: string;
  active: boolean;
  file: File;
  age: number;
  fromRemote?: boolean;
  results?: MriResult[];
}

export interface FileUploadProps {
  files: NiiFile[];
  setFiles: React.Dispatch<React.SetStateAction<NiiFile[]>>;
}
