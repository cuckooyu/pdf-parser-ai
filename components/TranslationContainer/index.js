import React, { useCallback, useState, useRef, useEffect } from 'react';
import './index.scss';
import { TranslationTools } from "../TranslationTools";
import { Form, Radio, Button, message,notification } from 'antd';
import { languageAtom, totalTextsAtom,totalTextsStoreAtom } from "../PDFContainer";
import { translationAtom, showTranslationAtom } from "../PDFMenu";
import { atom, useAtomValue, useAtom, useSetAtom } from 'jotai';
import { selectedPDFAtom, toggleLeftAtom } from "../LeftPanel";
import {
    collectQuery,
    parseQueryStr,
    highlightingCorrespondingTexts,
    removeHighlightingCorrespondingTexts
} from './util';

const translateNowAtom = atom(false);
const translateCompleteAtom = atom(false);
const translateStoreAtom = atom({});

const translator = await self.translation.createTranslator({
    sourceLanguage: 'en',
    targetLanguage: 'zh',
});

function TranslationContainer() {
    const [scale, setScale] = useState(15);
    const [syncPDF, setSyncPDF] = useState(false);
    const selectPDF = useAtomValue(selectedPDFAtom);
    const language = useAtomValue(languageAtom);
    const totalTextsStore = useAtomValue(totalTextsStoreAtom);
    const [translateStore, setTranslateStore] = useAtom(translateStoreAtom);
    const setTranslateNow = useSetAtom(translateNowAtom);
    const setTranslateComplete = useSetAtom(translateCompleteAtom);
    const setShowTranslation = useSetAtom(showTranslationAtom);
    const translationContainerRef = useRef(null);
    const currentPDFRef = useRef(null);
    const syncPDFRef = useRef(false);
    const [loading, setLoading] = useState(false);
    const totalTexts = useAtomValue(totalTextsAtom);//[]

    const renderTranslateResult=(result,totalTexts)=>{
        // PDF target not change yet.
        let fragment = document.createDocumentFragment();
        let resultLength = result.length;
        for (let i = 0; i < resultLength; i++) {
            let current = document.createElement("div");
            current.innerText = result[i];
            let queryString = collectQuery(totalTexts[i]);
            current.setAttribute("data-query-index", queryString);
            fragment.appendChild(current);
        }
        // setTranslateData(fragment)
        translationContainerRef.current.appendChild(fragment);
  }

    const translateArticle = async (pdfInfo) => {
        translationContainerRef.current.innerHTML = "";
        setTranslateNow(true);
        let result = [];
        for (let item of totalTexts) {
            let tmp = await translator.translate(item.str);
            result.push(tmp);
        }

        setTranslateNow(false);
        setTranslateComplete(true);
        setShowTranslation(true);
        setTranslateStore({ ...translateStore, [pdfInfo.key]: result })
        if (pdfInfo.key == currentPDFRef.current.key) {
            renderTranslateResult(result,totalTexts)
        } else {
            notification.success({
                message: `Translation is over`,
                description:
                  `Go to ${pdfInfo.title} to check the results.`,
              });
        }
        setLoading(false);    
    }
    useEffect(()=>{
        syncPDFRef.current=syncPDF;
    },[syncPDF])

    // when change pdf file
    useEffect(() => {
        if (translationContainerRef.current) {
            translationContainerRef.current.innerHTML = "";
        }
        currentPDFRef.current = selectPDF;    
        if(translateStore[selectPDF.key]){
            renderTranslateResult(translateStore[selectPDF.key],totalTextsStore[selectPDF.key])
        }
    }, [selectPDF])

    const handleHover = (e) => {
        let dqi = e.target.getAttribute('data-query-index');
        if (dqi) {
            let arr = parseQueryStr(dqi);
            highlightingCorrespondingTexts(arr, syncPDFRef.current);
        }
    }

    const handleLeave = (e) => {
        let dqi = e.target.getAttribute('data-query-index');
        if (dqi) {
            let arr = parseQueryStr(dqi);
            removeHighlightingCorrespondingTexts(arr)
        }
    }

    useEffect(() => {
        let target = document.querySelector(".translation-html-container");
        if (target) {
            target.addEventListener('mouseover', handleHover)
            target.addEventListener('mouseout', handleLeave)
        }
        return () => {
            target.removeEventListener('mouseover', handleHover)
            target.removeEventListener('mouseout', handleLeave)
        }
    }, [])

    const submit = () => {
        if (translationContainerRef.current) {
            translationContainerRef.current.innerHTML = "";
        }
        setLoading(true);
        translateArticle(selectPDF,totalTexts);
    }
    const langText = (str) => {
        switch (str) {
            case 'en':
                return 'an English';
            case 'zh':
                return 'a Chinese';
            default:
                break;
        }
    }

    return (
        <>
            <div className='translate-container'>
                <h2>Translate
                    {
                        <div className="icon-with-text" title="language">
                            <i className="iconfont icon-global"></i><b>{`This is ${langText(language)} PDF document.`}</b>
                        </div>
                    }
                </h2>

                <Button className="translate-button" type="primary" onClick={submit} loading={loading} iconPosition="start">Translate</Button>
                <TranslationTools
                    scale={scale}
                    setScale={setScale}
                    syncPDF={syncPDF}
                    setSyncPDF={setSyncPDF}
                ></TranslationTools>
                <div className='translation-container'>
                    <div className='translation-html-container'
                        ref={translationContainerRef}
                        style={{ "fontSize": `${scale}px`, "lineHeight": `${scale + 2}px` }}>
                    </div>
                </div>
            </div>
        </>
    );
}

export {
    translateNowAtom,
    TranslationContainer,
    translateCompleteAtom
}
