import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useResizeObserver } from '@wojtekmaj/react-hooks';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './index.scss';
import { selectedPDFAtom } from "../LeftPanel";
import { PDFTools } from "../PDFTools";

import {
    addDataAttribute,
    parseEnPDF,
    getLanguageSample,
} from './util';

import { atom, useAtomValue, useAtom, useSetAtom } from 'jotai';
const totalTextsStoreAtom = atom({});
const totalTextsAtom = atom([]);

const languageAtom = atom("");

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const options = {
    cMapUrl: '/cmaps/',
    standardFontDataUrl: '/standard_fonts/',
};

const maxWidth = 800;

const detectLanguage = async (testTexts) => {
    const canDetect = await translation.canDetect();
    let detector;
    if (canDetect === 'no') {
        // The language detector isn't usable.
        return;
    }
    if (canDetect === 'readily') {
        // The language detector can immediately be used.
        detector = await translation.createDetector();
    } else {
        // The language detector can be used after model download.
        detector = await translation.createDetector();
        detector.addEventListener('downloadprogress', (e) => {
            console.log(e.loaded, e.total);
        });
        await detector.ready;
    }
    const results = await detector.detect(testTexts);
    // let confidence = (results[0].confidence.toFixed(2)) * 100;
    let currentLanguage = results[0].detectedLanguage;
    return currentLanguage;

}

function PDFContainer() {
    const [numPages, setNumPages] = useState();
    const [scale, setScale] = useState(1);
    const [containerRef, setContainerRef] = useState(null);
    const [containerWidth, setContainerWidth] = useState();
    const selectPDF = useAtomValue(selectedPDFAtom);
    const setTotalTextsData = useSetAtom(totalTextsAtom);
    const [totalTextsStore, setTotalTextsStore] = useAtom(totalTextsStoreAtom);
    const setLanguage = useSetAtom(languageAtom);
    const downloadedCountRef = useRef(0);
    const totalTextsRef = useRef([]);
    const parseCompleteRef = useRef(false);
    // const resizeObserverOptions = {};
    // const onResize = useCallback((entries) => {
    //     const [entry] = entries;

    //     if (entry) {
    //         setContainerWidth(entry.contentRect.width);
    //     }
    // }, []);

    // useResizeObserver(containerRef, resizeObserverOptions, onResize);

    // when change pdf file
    useEffect(() => {
        parseCompleteRef.current = false;
        downloadedCountRef.current = 0;
    }, [selectPDF])

    function onDocumentLoadSuccess({ numPages }) {
        totalTextsRef.current = [];
        for (let i = 0; i < numPages; i++) {
            totalTextsRef.current.push([]);
        }
        setNumPages(numPages);
    }

    const mergeStrings = (arr, index) => {
        if (parseCompleteRef.current) return;
        const reg = new RegExp("[\u4e00-\u9fa5_a-zA-Z0-9]");
        let al = arr.items.length;
        for (let i = 0; i < al; i++) {
            let current = arr.items[i];
            if (reg.test(current) && current.length !== 1) {
                totalTextsRef.current[index].push(current);
            }
        }

        if (downloadedCountRef.current == numPages - 1) {
            // pdf download complete
            let result = parseEnPDF(totalTextsRef.current, false);
            setTotalTextsData(result);
            setTotalTextsStore({ ...totalTextsStore, [selectPDF.key]: result })
            let testLanguageText = getLanguageSample(result);
            let lang = detectLanguage(testLanguageText);
            setLanguage(lang);
            parseCompleteRef.current = true;
            addDataAttribute(totalTextsRef.current);
        } else {
            downloadedCountRef.current = downloadedCountRef.current + 1;
        }
    }

    const handleLeave = () => {
        addDataAttribute(totalTextsRef.current);
    }

    useEffect(() => {
        let target = document.querySelector(".pdf-panel");
        if (target) {
            target.addEventListener('mouseleave', handleLeave)
        }
        return () => {
            target.removeEventListener('mouseleave', handleLeave)
        }
    }, [])

    return (
        <>
            {
                selectPDF ? <PDFTools setScale={setScale} scale={scale}></PDFTools> : ""
            }

            <div className="PDF-container" ref={setContainerRef}>
                <Document
                    file={selectPDF.url ? selectPDF.url : null}
                    onLoadSuccess={onDocumentLoadSuccess}
                    noData={<div className="nofile-tip">No PDF file specified<br />Select one from leftside</div>}
                    options={options}>

                    {Array.from(new Array(numPages), (el, index) => (
                        <Page
                            onGetTextSuccess={(arr) => {
                                mergeStrings(arr, index);
                            }}
                            scale={scale}
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            renderAnnotationLayer={false}
                            width={containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth}
                        />
                    ))}
                </Document>
            </div>
        </>
    );
}

export {
    totalTextsStoreAtom,
    PDFContainer,
    languageAtom,
    totalTextsAtom
}
