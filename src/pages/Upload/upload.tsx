import { type ChangeEvent, useRef, useState } from 'react';
import { getJobStatus, uploadDocuments } from '../../services/documentService';
import './upload.scss';

const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

const Upload = () => {
    const [userName] = useState(() => {
        const storedName = localStorage.getItem('userName')?.trim();
        if (storedName) {
            return storedName;
        }
        const storedEmail = localStorage.getItem('userEmail') ?? '';
        const emailName = storedEmail.split('@')[0]?.trim();
        return emailName || 'user';
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sentFiles, setSentFiles] = useState<string[]>([]);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [uploadResponseMessage, setUploadResponseMessage] = useState<string | null>(null);
    const [jobStatusMessage, setJobStatusMessage] = useState<string | null>(null);
    const [isCheckingJobStatus, setIsCheckingJobStatus] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isFileInputDisabled, setIsFileInputDisabled] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const openFileDialog = () => {
        if (isFileInputDisabled) {
            return;
        }
        fileInputRef.current?.click();
    };

    const clearFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        clearFileInput();

        if (!files.length) {
            return;
        }

        const acceptedFiles: File[] = [];
        const rejectedFiles: string[] = [];

        files.forEach((file) => {
            const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
            if (allowedExtensions.includes(extension)) {
                acceptedFiles.push(file);
            } else {
                rejectedFiles.push(file.name);
            }
        });

        if (rejectedFiles.length) {
            setErrorMessage(`Unsupported files skipped: ${rejectedFiles.join(', ')}`);
        } else {
            setErrorMessage(null);
        }

        if (!acceptedFiles.length) {
            setSelectedFiles([]);
            setIsFileInputDisabled(false);
            setStatusMessage(null);
            setSentFiles([]);
            setErrorMessage('Only Word, Excel, or PDF documents are allowed.');
            return;
        }

        setSelectedFiles(acceptedFiles);
        setStatusMessage(null);
        setSentFiles([]);
        setIsFileInputDisabled(true);
    };

    const removeFile = (index: number) => {
        setSelectedFiles((files) => {
            const updated = files.filter((_, idx) => idx !== index);
            if (!updated.length) {
                setIsFileInputDisabled(false);
            }
            return updated;
        });
    };

    const handleSendDocuments = async () => {
        if (!selectedFiles.length) {
            return;
        }

        const fileNames = selectedFiles.map((file) => file.name);
        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files', file);
        });

        setIsSending(true);
        setUploadResponseMessage(null);
        setJobStatusMessage(null);
        setErrorMessage(null);

        try {
            const response = await uploadDocuments(formData, userName || 'user');
            const responseMessage = response?.data?.message as string | undefined;
            const jobId = response?.data?.job_id as string | undefined;

            setUploadResponseMessage(responseMessage ?? null);
            setStatusMessage(`The following documents have been sent by ${userName || 'user'}:`);
            setSentFiles(fileNames);
            setSelectedFiles([]);

            if (jobId) {
                setIsCheckingJobStatus(true);
                setJobStatusMessage(null);
                try {
                    const jobStatusResponse = await getJobStatus(jobId);
                    const statusData = jobStatusResponse?.data;
                    const derivedMessage =
                        typeof statusData === 'string'
                            ? statusData
                            : statusData?.message ??
                              statusData?.status ??
                              JSON.stringify(statusData);

                    setJobStatusMessage(derivedMessage ?? null);
                } catch (jobStatusError) {
                    console.error('Failed to fetch job status', jobStatusError);
                    setJobStatusMessage('Failed to fetch job status.');
                } finally {
                    setIsCheckingJobStatus(false);
                }
            }
        } catch (error) {
            console.error('Failed to send documents', error);
            setErrorMessage('Failed to send documents. Please try again.');
            setUploadResponseMessage(null);
        } finally {
            setIsSending(false);
            setIsFileInputDisabled(false);
        }
    };

    return (
        <div className='document-upload-page container'>
            <h1 className='page-title'>Document Upload</h1>

            <div className='button-row'>
                <input
                    ref={fileInputRef}
                    type='file'
                    accept='.pdf,.doc,.docx,.xls,.xlsx'
                    multiple
                    onChange={handleFileSelection}
                    className='hidden-file-input'
                />

                <button
                    type='button'
                    className='btn btn-primary'
                    onClick={openFileDialog}
                    disabled={isFileInputDisabled || isSending}
                >
                    Upload Documents
                </button>

                <button
                    type='button'
                    className='btn btn-outline-primary'
                    onClick={handleSendDocuments}
                    disabled={!selectedFiles.length || isSending}
                >
                    {isSending ? 'Sending...' : 'Send To Backend'}
                </button>
            </div>

            <p className='helper-text'>Allowed formats: Word (.doc, .docx), Excel (.xls, .xlsx), PDF (.pdf)</p>

            {errorMessage && <div className='alert alert-danger' role='alert'>{errorMessage}</div>}
            {statusMessage && (
                <div className='alert alert-success' role='alert'>
                    <p className='mb-1'>{statusMessage}</p>
                    <ul className='mb-0'>
                        {sentFiles.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                </div>
            )}

            {uploadResponseMessage && (
                <div className='alert alert-info mt-2' role='alert'>
                    {uploadResponseMessage}
                </div>
            )}

            {jobStatusMessage && (
                <div className='alert alert-secondary mt-2' role='alert'>
                    {jobStatusMessage}
                </div>
            )}

            {isCheckingJobStatus && (
                <div className='job-status-loader mt-2' aria-label='Checking job status'>
                    <span className='spinner' />
                    <span className='ms-2'>Checking job status...</span>
                </div>
            )}

            <div className='file-list card'>
                <div className='card-body'>
                    <h2 className='file-list-title'>Selected Documents</h2>
                    {selectedFiles.length ? (
                        <ul className='list-group list-group-flush'>
                            {selectedFiles.map((file, index) => (
                                <li key={file.name + index} className='list-group-item d-flex justify-content-between align-items-center'>
                                    <span>{file.name}</span>
                                    <button type='button' className='btn btn-link' onClick={() => removeFile(index)}>
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className='text-muted mb-0'>No documents selected.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Upload;
