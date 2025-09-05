/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ModalContent, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { React, useMemo, Tooltip, Text, SearchableSelect, useState, useEffect } from "@webpack/common";
import * as DataStore from "@api/DataStore";
import { initializeRegionCache, localization } from "../utils";

import { CategoryImage } from "./categoryImage";
import { CategoryScroller } from "./categoryScroller";
import { CategoryWrapper } from "./categoryWrapper";
import { CogIcon, RecentlyUsedIcon } from "./icons";
import { RECENT_STICKERS_ID, RECENT_STICKERS_TITLE } from "./recent";
import { Settings } from "./settings";
import { StickerCategory } from "./stickerCategory";
import { clPicker } from "../utils";
import { Switch } from "@components/Switch";
import { TextInput } from "@webpack/common";


export interface StickerCategory {
    id: string;
    name: string;
    iconUrl?: string;
}

export interface SidebarProps {
    packMetas: StickerCategory[];
    onPackSelect: (category: StickerCategory) => void;
}

export const RecentPack = {
    id: RECENT_STICKERS_ID,
    name: RECENT_STICKERS_TITLE,
} as StickerCategory;

export const PickerSidebar = ({ packMetas, onPackSelect }: SidebarProps) => {
    const [activePack, setActivePack] = React.useState<StickerCategory>(RecentPack);
    const [hovering, setHovering] = React.useState(false);

    return (
        <CategoryWrapper>
            <CategoryScroller categoryLength={packMetas.length}>
                <StickerCategory
                    style={{ padding: "4px", boxSizing: "border-box", width: "32px" }}
                    isActive={activePack === RecentPack}
                    onClick={() => {
                        if (activePack === RecentPack) return;

                        onPackSelect(RecentPack);
                        setActivePack(RecentPack);
                    }}
                >
                    <RecentlyUsedIcon width={24} height={24} color={
                        activePack === RecentPack ? " var(--interactive-active)" : "var(--interactive-normal)"
                    } />
                </StickerCategory>
                {
                    ...packMetas.map(pack => {
                        return (
                            <StickerCategory
                                key={pack.id}
                                onClick={() => {
                                    if (activePack?.id === pack.id) return;

                                    onPackSelect(pack);
                                    setActivePack(pack);
                                }}
                                isActive={activePack?.id === pack.id}
                            >
                                <CategoryImage src={pack.iconUrl!} alt={pack.name} isActive={activePack?.id === pack.id} />
                            </StickerCategory>
                        );
                    })
                }
            </CategoryScroller>
            <div className={clPicker("settings-cog-container")}>
                <button
                    className={clPicker("settings-cog") + (
                        hovering ? ` ${clPicker('settings-cog-active')}` : ""
                    )}
                    onClick={() => {
                        openModal(modalProps => {
                            return (
                                <ModalRoot size={ModalSize.LARGE} {...modalProps}>
                                    <ModalHeader>
                                        <Text tag="h2">{localization("Stickers+")}</Text>
                                        <Prefs />
                                    </ModalHeader>
                                    <ModalContent>
                                        <Settings />
                                    </ModalContent>
                                </ModalRoot>

                            );
                        });
                    }}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                >
                    <CogIcon width={20} height={20} />
                </button>
            </div>
        </CategoryWrapper>
    );
};


export const Prefs = () => {
    const [isChecked, setIsChecked] = useState(false);
    const [region, setRegion] = useState('');

    useEffect(() => {
        const loadState = async () => {
            const savedResizeState = await DataStore.get('resizeSwitchState');
            const savedRegion = await DataStore.get('region');
            if (savedResizeState !== null) {
                setIsChecked(savedResizeState);
            }
            if (savedRegion !== null) {
                setRegion(savedRegion);
            }
        };
        loadState();
    }, []);

    const handleSwitchChange = async (checked: boolean) => {
        setIsChecked(checked);
        await DataStore.set('resizeSwitchState', checked);
    };

    const handleLanguageChange = async (selectedOption: string) => {
        if (selectedOption) {
            const selectedRegion = selectedOption;
            await DataStore.set('region', selectedRegion);
            setRegion(selectedRegion);
            initializeRegionCache();
        }
    };

    const languageOptions = useMemo(
        () => [
            { value: 'en', label: 'English' },
            { value: 'ja', label: 'Japanese' }
        ],
        []
    );

    return (
        <div style={{ position: "absolute", right: 10, display: 'flex', alignItems: 'center' }}>
            <h2 style={{ color: "white", fontSize:15, margin: 0, marginRight: '-3px' }}>{localization("Language")}</h2>
            <div style={{ transform: "scale(0.85)" }}>
                <SearchableSelect
                    options={languageOptions}
                    value={languageOptions.find(o => o.value === region)}
                    placeholder="Select a language"
                    maxVisibleItems={5}
                    closeOnSelect={true}
                    onChange={v => handleLanguageChange(v)}
                    autoFocus={false}
                />
            </div>
            <h3 style={{ color: "white", fontSize:15, margin: 0, marginRight: '8px' }}>{localization("No Resize")}</h3>
            <Switch
                checked={isChecked}
                onChange={handleSwitchChange}
                disabled={false}
            />
        </div>
    );
};
