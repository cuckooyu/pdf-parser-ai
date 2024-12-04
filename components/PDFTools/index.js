import React, { useCallback, useState } from 'react';
import { languageAtom } from "../PDFContainer";
import { translateNowAtom } from "../TranslationContainer";
import { atom, useAtomValue, useSetAtom, useAtom } from 'jotai';
import './index.scss';
function PDFTools({ setScale, scale }) {
    // Increase font size
    const increaseSize = () => {
        let tmp = Number((scale * 1.1).toFixed(2))
        if (scale > 1.6) {
        } else {
            setScale(tmp);
        }
    }

    // Reduce font size
    const reduceSize = () => {
        let tmp = Number((scale * 0.9).toFixed(2))
        if (scale < 0.8) {
        } else {
            setScale(tmp);
        }
        // resetHighlightArrRef();
        // resetTotalTextsRef();
    }
    return (
        <div className='pdf-tools'>
            <i className="iconfont icon-zoom-in" title="Increase font size" onClick={increaseSize}></i>
            <i className="iconfont icon-zoom-out" title="Reduce font size" onClick={reduceSize}></i>
        </div>
    );
}

export {
    PDFTools
}
