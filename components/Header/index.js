import React, { useCallback, useState } from 'react';
import { selectedPDFAtom, toggleLeftAtom } from "../LeftPanel";
import { PDFMenu } from "../PDFMenu";
import { atom, useAtomValue, useSetAtom, useAtom } from 'jotai';
import './index.scss';
function Header() {
    const selectPDF = useAtomValue(selectedPDFAtom);
    const [toggleLeft, setToggleLeft] = useAtom(toggleLeftAtom);
    return (
        <div className='header'>
            <div className='opera-toggle'>
                {
                    !toggleLeft ? <i className="iconfont icon-right-double-arrow" title="translation" onClick={() => setToggleLeft(!toggleLeft)}></i>
                        : <i className="iconfont icon-left-double-arrow" title="translation" onClick={() => setToggleLeft(!toggleLeft)}></i>
                }
            </div>

            <h5>{selectPDF.title||"PDF Parser"}</h5>
            <PDFMenu></PDFMenu>
        </div>
    );
}

export {
    Header,
    selectedPDFAtom
}
