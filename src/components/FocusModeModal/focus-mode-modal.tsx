import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import api from '../../services/api';
import './focus-mode-modal.scss';

interface FocusModeModalProps {
    onClose: () => void;
    onDisable: () => void;
}

const sanitizeFileName = (value: string) => {
    const cleaned = value.trim().replace(/[\\/:*?\\"<>|]/g, '').replace(/\s+/g, '-');
    return cleaned || 'summary-report';
};

const buildFallbackFileName = (companyName: string, air: string) => {
    if (companyName) {
        return `${companyName}-summary`;
    }

    if (air) {
        return `${air}-summary`;
    }

    return 'summary-report';
};

const ensurePdfExtension = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
};

const FocusModeModal = ({ onClose, onDisable }: FocusModeModalProps) => {
    const [companyName, setCompanyName] = useState('');
    const [air, setAir] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const summaryDownloadUrl = 'https://bca-chatbot-fkbfd2cfa2b9gvh0.uaenorth-01.azurewebsites.net/summary';

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        onClose();
    };

    const handleDisableClick = () => {
        setCompanyName('');
        setAir('');
        setError(null);
        onDisable();
    };

    const handleGenerateSummary = async () => {
        setError(null);

        const trimmedCompanyName = companyName.trim();
        const trimmedAir = air.trim();

        if (!trimmedCompanyName || !trimmedAir) {
            setError('Please provide both the company name and AIR to generate a summary.');
            return;
        }

        if (!summaryDownloadUrl) {
            setError('Summary export service is not configured.');
            return;
        }

        setIsGenerating(true);
        try {
            // Expect JSON directly from backend
            const response = await api.post(
                summaryDownloadUrl,
                { company: trimmedCompanyName, year: trimmedAir },
                {
                    responseType: 'json',
                    headers: { Accept: 'application/json' },
                }
            );

            // shape: { summary: { summary: "markdown/text..." } }
            const summaryText: string | undefined = response?.data?.summary?.summary;
            if (!summaryText) {
                throw new Error('Server returned JSON without a "summary.summary" field.');
            }

            // Lazy-load jsPDF to avoid initial bundle bloat
            const { jsPDF } = await import('jspdf');

            // --- PDF rendering (markdown-aware but lightweight) ---
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const marginX = 48;
            const marginY = 56;
            const maxY = doc.internal.pageSize.getHeight() - marginY;
            const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
            let cursorY = marginY;

            const addPageIfNeeded = (increment = 0) => {
                if (cursorY + increment > maxY) {
                    doc.addPage();
                    cursorY = marginY;
                }
            };

            const writeParagraph = (text: string, fontSize = 12, bold = false, lineGap = 4) => {
                doc.setFont('Times', bold ? 'bold' : 'normal');
                doc.setFontSize(fontSize);
                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach((line: string | string[]) => {
                    addPageIfNeeded(fontSize + lineGap);
                    doc.text(line, marginX, cursorY);
                    cursorY += fontSize + lineGap;
                });
            };

            const writeSpacer = (h = 10) => {
                addPageIfNeeded(h);
                cursorY += h;
            };

            // very small markdown pass: #, ##, ###, lists, horizontal rules, code fence
            const lines = summaryText.replace(/\r\n/g, '\n').split('\n');

            let inCodeBlock = false;
            lines.forEach((raw) => {
                const line = raw.trimRight();

                // Code fence ```
                if (line.trim().startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                    writeSpacer(6);
                    return;
                }

                if (inCodeBlock) {
                    // monospace look with bold off and a boxy background effect (light)
                    doc.setFont('Courier', 'normal');
                    doc.setFontSize(11);
                    const codeLines = doc.splitTextToSize(raw, maxWidth);
                    codeLines.forEach((cl: string | string[]) => {
                        addPageIfNeeded(15);
                        doc.text(cl, marginX, cursorY);
                        cursorY += 15;
                    });
                    return;
                }

                // Horizontal rule --- or ***
                if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
                    addPageIfNeeded(12);
                    doc.setLineWidth(0.7);
                    doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
                    cursorY += 12;
                    return;
                }

                // Headings
                if (/^#{1,6}\s+/.test(line)) {
                    const level = (line.match(/^#+/)?.[0].length ?? 1);
                    const text = line.replace(/^#{1,6}\s+/, '').trim();
                    const sizes = { 1: 20, 2: 18, 3: 16, 4: 14, 5: 13, 6: 12 } as const;
                    const size = sizes[Math.min(level, 6) as 1 | 2 | 3 | 4 | 5 | 6];
                    writeSpacer(level <= 2 ? 8 : 6);
                    writeParagraph(text, size, true, 6);
                    writeSpacer(2);
                    return;
                }

                // Lists
                if (/^(\*|-|\+)\s+/.test(line) || /^\d+\.\s+/.test(line)) {
                    // group consecutive list items
                    const bullet = /^(\*|-|\+)\s+/.test(line);
                    const marker = bullet ? '•' : (line.match(/^(\d+)\./)?.[1] ?? '1') + '.';
                    doc.setFont('Times', 'normal');
                    doc.setFontSize(12);

                    const itemText = line.replace(/^(\*|-|\+|\d+\.)\s+/, '');
                    const wrapped = doc.splitTextToSize(itemText, maxWidth - 20);

                    addPageIfNeeded(16);
                    // marker
                    doc.text(marker, marginX, cursorY);
                    // text (indented)
                    wrapped.forEach((w: string | string[], i: number) => {
                        if (i === 0) {
                            doc.text(w, marginX + 18, cursorY);
                            cursorY += 16;
                        } else {
                            addPageIfNeeded(16);
                            doc.text(w, marginX + 18, cursorY);
                            cursorY += 16;
                        }
                    });
                    return;
                }

                // Empty line -> paragraph spacer
                if (line.trim() === '') {
                    writeSpacer(6);
                    return;
                }

                // Normal paragraph
                writeParagraph(line);
            });

            // Filename
            const fallbackName = ensurePdfExtension(
                sanitizeFileName(buildFallbackFileName(trimmedCompanyName, trimmedAir))
            );

            // Download
            doc.save(fallbackName);
        } catch (err) {
            console.error('Failed to generate summary PDF:', err);
            setError('Unable to generate the summary right now. Please try again later.');
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="focus-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="focus-mode-title">
            <div className="focus-modal">
                <button
                    type="button"
                    className="focus-modal__close"
                    onClick={handleDisableClick}
                    aria-label="Close focus mode modal"
                >
                    <IoClose size={20} />
                </button>

                <div className="focus-modal__content">
                    <h2 id="focus-mode-title">Generate Summary</h2>
                </div>

                <form className="focus-modal__form" onSubmit={handleSubmit}>
                    <label className="focus-modal__field" htmlFor="focus-company-name">
                        <span>Company name</span>
                        <input
                            id="focus-company-name"
                            name="companyName"
                            type="text"
                            value={companyName}
                            onChange={(event) => {
                                setCompanyName(event.target.value);
                                if (error) {
                                    setError(null);
                                }
                            }}
                            placeholder="Enter company name"
                            disabled={isGenerating}
                        />
                    </label>

                    <label className="focus-modal__field" htmlFor="focus-air">
                        <span>Year</span>
                        <input
                            id="focus-air"
                            name="air"
                            type="text"
                            value={air}
                            onChange={(event) => {
                                setAir(event.target.value);
                                if (error) {
                                    setError(null);
                                }
                            }}
                            placeholder="Enter Year"
                            disabled={isGenerating}
                        />
                    </label>

                    <div className="focus-modal__actions">

                        <button
                            type="button"
                            className="btn-outline"
                            onClick={handleGenerateSummary}
                            disabled={isGenerating}
                            aria-busy={isGenerating}
                        >
                            {isGenerating ? 'Generating...' : 'Generate Summary'}
                        </button>
                        <button type="button" className="btn-primary" onClick={handleDisableClick} disabled={isGenerating}>
                            Go Back
                        </button>
                    </div>

                    {error && (
                        <div className="focus-modal__error" role="alert">
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default FocusModeModal;
