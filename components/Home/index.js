import React, { useCallback, useState,useEffect } from 'react';
import { PDFContainer } from '../PDFContainer';
import { ConfigProvider } from 'antd';
import { LeftPanel, toggleLeftAtom } from '../LeftPanel';
import { SummarizeContainer } from '../SummarizeContainer';
import { TranslationContainer } from '../TranslationContainer';
import { showSummarizeAtom, showTranslationAtom } from '../PDFMenu';
import { Header } from '../Header';
import { Col, Row } from 'antd';
import { atom, useAtomValue } from 'jotai';
import './index.scss';

function Home() {
    const toggleLeft = useAtomValue(toggleLeftAtom);
    const showTranslation = useAtomValue(showTranslationAtom);
    const showSummarize = useAtomValue(showSummarizeAtom);

    const handleLeftPanelClass = () => {
        return !toggleLeft ? "left-panel left-panel-fixed" : "left-panel left-panel-fixed show-left";
    }

    // useEffect(()=>{
    //     if ('translation' in self && 'createTranslator' in self.translation && 'translation' in self && 'canDetect' in self.translation && 'ai' in self && 'summarizer' in self.ai) {
    //         // The Translator API is supported.
    //       }else{
    //         alert('1')
    //       }
    // },[])

    const handleTranslationPanelClass = () => {
        if (showTranslation && !showSummarize) {
            return "translation-panel devide-2";
        }
        if (showTranslation && showSummarize) {
            return "translation-panel devide-3";
        }
        if (!showTranslation && showSummarize) {
            return "translation-panel panel-hiden";
        }
        if (!showTranslation && !showSummarize) {
            return "translation-panel panel-hiden";
        }
    }

    const handleSummarizePanelClass = () => {
        if (showTranslation && !showSummarize) {
            return "summarize-panel panel-hiden";
        }
        if (showTranslation && showSummarize) {
            return "summarize-panel devide-3";
        }
        if (!showTranslation && showSummarize) {
            return "summarize-panel devide-2";
        }
        if (!showTranslation && !showSummarize) {
            return "summarize-panel panel-hiden";
        }
    }


    return <>
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#0c0c22',
                },
                components:{
                    Button:{
                        borderRadius: 20, 
                    }
                }
            }}
        >
            <Row>
                <Col span={24}>
                    <Header></Header>
                </Col>
            </Row>
            <div className='main'>
                <div className={handleLeftPanelClass()}>
                    <LeftPanel></LeftPanel>
                </div>
                <div className='pdf-panel'>
                    <PDFContainer></PDFContainer>
                </div>
                <div className={handleTranslationPanelClass()}>
                    <TranslationContainer></TranslationContainer>
                </div>

                <div className={handleSummarizePanelClass()}>
                    <SummarizeContainer></SummarizeContainer>
                </div>

            </div>
        </ConfigProvider>
    </>;
}

export default Home;
