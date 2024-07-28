import React, { useState } from 'react';
import { Renderer, TableView, TableViewHeader } from '../../packages/ui/TableView';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const checkboxStyles = 'rounded border-gray-300';

const Button: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-300"
        onClick={onClick}
    >
        {children}
    </button>
);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({
    label,
    checked,
    onChange,
}) => (
    <label className="flex items-center space-x-2">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={checkboxStyles}
        />
        <span>{label}</span>
    </label>
);

interface ScriptItem {
    [key: string]: string
}

class ScriptItemRenderer implements Renderer<ScriptItem> {
    type: string;
    constructor(type: string) {
        this.type = type;
    }
    render({ input }: { input: ScriptItem }): React.ReactNode {
        return (
            <div className='select-none text-sm text-nowrap px-2 py-2 truncate'>
                {input[this.type] as string}
            </div>
        );
    }
}

const ScriptList: React.FC = () => {
    const headers: TableViewHeader<ScriptItem>[] = [
        {
            title: "Name",
            renderer: new ScriptItemRenderer("name"),
            minWidth: 100,
            sortable: true,
        },
        {
            title: "Method",
            renderer: new ScriptItemRenderer("method"),
            minWidth: 100,
            sortable: true,
        },
        {
            title: "Matching Rule",
            renderer: new ScriptItemRenderer("matching_rule"),
            minWidth: 100,
            sortable: true,
        },
    ];

    const [data, setTrafficList] = useState<ScriptItem[]>([
        {
            name: "Test Modify POst Query",
            method: "POST",
            matching_rule: "Awesome"
        },
    ]);


    const handleCheckboxChange = (checked: boolean) => {
        // Handle checkbox change logic here
    };

    const handleEmptyButtonClick = () => {
        // Handle empty button click logic here
    };

    return (
        <DndProvider backend={HTML5Backend}>
        <div className="p-8 space-y-8">
            {/* Horizontal stack (hstack) */}
            <div className="flex items-center space-x-4">
                {/* Checkbox component */}
                <Checkbox label="enable scripting tool" checked={false} onChange={handleCheckboxChange} />
                {/* Text element */}
                <p>Use javascript to modify the request or response content automatically</p>
                {/* Text element */}
                <p>Top-down matching rule</p>
            </div>

            <div className='flex-grow'>
                <TableView headers={headers} data={data} />
            </div>

            {/* Text elements */}
            <div className="space-x-4">
                <p>texts</p>
                {/* Example of using the Button component */}
                <Button onClick={() => { }}>+ button</Button>
                <Button onClick={() => { }}>- button</Button>
                <Button onClick={() => { }}>question button</Button>
                {/* Example of more dropdown (not implemented here) */}
                <div className="relative inline-block text-left">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-300">
                        more dropdown
                    </button>
                    {/* Dropdown content */}
                    {/* This can be implemented using Tailwind's transition and opacity classes */}
                </div>
            </div>
        </div>
        </DndProvider>
    );
};

export default ScriptList;
