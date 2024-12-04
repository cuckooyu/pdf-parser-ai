import React, { useCallback, useState } from 'react';
import { selectedPDFAtom } from "../LeftPanel";
import { Tooltip } from 'antd';
// import { summarizeNowAtom, summarizeCompleteAtom } from "../SummarizeContainer";
// import { translateNowAtom } from "../TranslationContainer";
import { atom, useAtomValue, useAtom } from 'jotai';
// import SettingModal from '../SettingModal';
import './index.scss';
const translationAtom = atom("");
const summarizerArticleAtom = atom(false);
const showSummarizeAtom = atom(false);
const showTranslationAtom = atom(false);
function PDFMenu() {
    // const translateNow = useAtomValue(translateNowAtom);
    // const summarizeNow = useAtomValue(summarizeNowAtom);
    // const [showModal, setShowModal] = useState(false);
    // const summarizeComplete = useAtomValue(summarizeCompleteAtom);
    const [showSummarize, setShowSummarize] = useAtom(showSummarizeAtom);
    const [showTranslation, setShowTranslation] = useAtom(showTranslationAtom);
    const selectPDF = useAtomValue(selectedPDFAtom);


    const handleTranslation = () => {
        if (!selectPDF) return;
        setShowTranslation(!showTranslation);
    }

    const handleSummarize = () => {
        if (!selectPDF) return;
        setShowSummarize(!showSummarize);
    }

    const renderTranslationClass = () => {
        return showTranslation ? "icon-wrap icon-wrap-selected" : "icon-wrap";
    }
    const renderSummarizeClass = () => {
        return showSummarize ? "icon-wrap icon-wrap-selected" : "icon-wrap";
        // if (summarizeNow) {
        //     return "icon-wrap show-loading";
        // }
        // if (summarizeComplete) {
        //     return showSummarize ? "icon-wrap show-ready icon-wrap-selected" : "icon-wrap show-ready";
        // }
    }

    return (
        <>
            <div className='opera-tools'>
                <Tooltip title={selectPDF ? '' : 'You have to choose a PDF first.'}>
                    <div className={renderTranslationClass()}>
                        <i className="iconfont icon-message-multi-language" title="translation" onClick={handleTranslation}></i>
                    </div>
                </Tooltip>

                <Tooltip title={selectPDF ? '' : 'You have to choose a PDF first.'}>
                    <div className={renderSummarizeClass()}>
                        <i className="iconfont icon-category" title="summarize" onClick={handleSummarize}></i>
                    </div>
                </Tooltip>
            </div>

            {/* <div className='opera-tools'>
                <Tooltip title={selectPDF ? '' : 'You have to choose a PDF first.'}>
                    <div className={translateNow ? 'icon-wrap show-loading' : 'icon-wrap'}>
                        <i className="iconfont icon-message-multi-language" title="translation" onClick={handleTranslation}></i>
                        <span className="speech-loader"></span>
                    </div>
                </Tooltip>

                <Tooltip title={selectPDF ? '' : 'You have to choose a PDF first.'}>
                    <div className={renderSummarizeClass()}>
                        <i className="iconfont icon-category" title="summarize" onClick={handleSummarize}></i>
                        <i className="iconfont icon-selected"></i>
                        <span className="speech-loader"></span>
                    </div>
                </Tooltip>
            </div> */}
            {/* <SettingModal setShowModal={setShowModal} showModal={showModal}></SettingModal> */}
        </>
    );
}

export {
    PDFMenu,
    translationAtom,
    summarizerArticleAtom,
    showSummarizeAtom,
    showTranslationAtom,
}
