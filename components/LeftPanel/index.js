import React, { useCallback, useState } from 'react';
import { Tree } from 'antd';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import './index.scss';
import pdf3 from '../../assets/ipad-pro-13inch-m4-info.pdf';
import pdf4 from '../../assets/google_introduction.pdf';
const { DirectoryTree } = Tree;
const treeData = [
    {
        title: 'PDF Document',
        key: '0-0',
        children: [
            {
                title: 'iPad_pro_13inch_m4.pdf',
                key: 'pdf-1',
                isLeaf: true,
                url: pdf3
            },
            {
                title: 'Google_Introduction.pdf',
                key: 'pdf-2',
                isLeaf: true,
                url: pdf4
            },
        ],
    }
];

const selectedPDFAtom = atom("");
const toggleLeftAtom = atom(true);
function LeftPanel() {
    const setSelectedPDF = useSetAtom(selectedPDFAtom);
    const toggleLeft = useAtomValue(toggleLeftAtom);
    const onSelect = (keys, info) => {
        setSelectedPDF({
            "title":info.node.title,
            "key":info.node.key,
            "url":info.node.url,
        });
    };
    const onExpand = (keys, info) => {
    };
    return (
        <div className='left-panel-inside'>
            <div className='directory-container'>
                <div className='tree-container'>
                    <DirectoryTree
                        defaultExpandAll
                        //   showLine={true}
                        onSelect={onSelect}
                        onExpand={onExpand}
                        treeData={treeData}
                    />
                </div>
            </div>
        </div>
    );
}

export {
    LeftPanel,
    selectedPDFAtom,
    toggleLeftAtom
}
