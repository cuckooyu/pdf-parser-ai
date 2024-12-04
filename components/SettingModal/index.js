import React, { useState, useEffect, useRef } from 'react';
import { Modal, Tabs, Input } from 'antd';
import Exapmle from './components/Exapmle';
import './index.scss';


function SettingModal({ setShowModal, showModal }) {
    const ModalCancel = () => {
        setShowModal(false);
    }

    const settingItems = [
        {
            label: "Help",
            key: 1,
            // children:"",
            children: <Exapmle ModalCancel={ModalCancel} />,
        },

    ]
    return (
        <>
            {/* <Modal
                title="设置"
                open={showModal}
                width={800}
                className="setting-modal"
                onCancel={ModalCancel}
                footer={null}
            >
                <Tabs
                    tabPosition={"left"}
                    items={settingItems}
                />
            </Modal> */}
            <Modal
                title="Settings"
                centered
                className="setting-modal"
                open={showModal}
                onOk={() => setShowModal(false)}
                onCancel={() => setShowModal(false)}
                width={800}
            >
                <Tabs
                    tabPosition={"left"}
                    items={settingItems}
                />
            </Modal>
        </>
    )
}

export default SettingModal;
