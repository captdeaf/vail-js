// kbdisplay.js
//
////////////////////////////////////
//
//  Render the connected keyboard, switch between layers, and
//  add keybind actions.
//
///////////////////////////////////

const MAINBOARD = {
    // Current layer
    selectedLayer: 0,
    // Refresh all keys (usually after KBINFO is updated entirely)
    updateAll: null,
    // Render a layer into a div. Used for printing.
    printLayers: null,
};

const BIG_KEYS = ['KC_ENTER', 'KC_CAPSLOCK'];

const scaleChildren = (element, scale) => {
    // shrink elements based on scale by recursively traversing children and modifying all measurement attributes
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.style) {
            child.style.width = `${parseInt(child.style.width, 10) * scale}px`;
            child.style.height = `${
                parseInt(child.style.height, 10) * scale
            }px`;
            child.style.left = `${parseInt(child.style.left, 10) * scale}px`;
            child.style.top = `${parseInt(child.style.top, 10) * scale}px`;
            child.style.borderWidth = `${
                parseInt(child.style.borderWidth, 10) * scale
            }px`;
            child.style.borderRadius = `${
                parseInt(child.style.borderRadius, 10) * scale
            }px`;
            child.fontSize = `${
                parseInt(child.style.fontSize, 10) * scale
            }px !important`;
            console.log(
                `${parseInt(child.style.fontSize, 10) * scale}px !important`
            );
        }
        scaleChildren(child, scale);
    }
};

addInitializer('connected', () => {
    function strDefault(val, i) {
        if (val) return val;
        return '' + i;
    }

    ////////////////////////////////////
    //
    //  Calculate keyboard scale based on container width
    //
    ////////////////////////////////////
    function calculateKeyboardScale(board, container) {
        if (!container || !board) return 1;
        const containerWidth = container.clientWidth;
        const boardWidth = parseInt(board.scrollWidth, 10);
        if (!containerWidth || !boardWidth) return 1;
        const scale = Math.min(1, (containerWidth - 10) / boardWidth);
        return Math.max(0.1, scale); // Ensure minimum scale of 0.1
    }

    function updateKeyboardScale(board) {
        boardParent = board.parentElement;
        if (boardParent.classList.contains('small-board-container')) {
            const container = board.closest('.small-board-container');
            const scale = calculateKeyboardScale(board, container);
            // board.style.zoom = scale;
        }
    }

    ////////////////////////////////////
    //
    //  Render a single keyreturning the .keyimage for updating.
    //
    //  Basically a modified version of KLE's template, since I don't want
    //  to import all of its libraries.
    //
    //  A key consists of:
    //    Outer div: keycap for rotation
    //    Inner divs: for key. This can be multiple divs, but only one
    //                should have the key label rendered into it.
    //
    ///////////////////////////////////
    function renderKey(kmid, opts) {
        const kle = KLE.calc(opts);
        const key = kle.key;
        const sizes = kle.sizes;
        const parms = kle.parms;
        const keyval = KBINFO.keymap[MAINBOARD.selectedLayer][kmid];

        const outerClasses = ['keycap'];
        if (key.ghost) outerClasses.push('ghosted');
        if (key.decal) outerClasses.push('decal');

        const outerStyle = {};
        if (key.rotation_angle) {
            outerStyle['transform'] = `rotate(${key.rotation_angle}deg)`;
            outerStyle[
                'transform-origin'
            ] = `${parms.origin_x}px ${parms.origin_y}px`;
        }

        const keystyle = {
            left: `${parms.outercapx * 1.05 + 3}px`,
            top: `${parms.outercapy * 1.05 + 3}px`,
            width: `${parms.outercapwidth}px`,
            height: `${parms.outercapheight}px`,
            'border-width': `${sizes.strokeWidth}px`,
            'border-radius': `${sizes.roundOuter}px`,
        };

        const keyboxstyle = {
            width: `60px`,
            height: `60px`,
            'border-width': `${sizes.strokeWidth}px`,
            'border-radius': `${sizes.roundOuter}px`,
            position: 'absolute',
        };

        var float_left = {};
        var float_right = {};
        if (KBINFO.payload.author === 'Morgan Venable') {
            // Cheap hack for "Is this a svalboard?"
            float_left = { 0: true, 1: true, 33: true, 34: true };
            float_right = { 3: true, 4: true, 31: true, 30: true };
        }
        if (float_right[kmid]) {
            keyboxstyle.right = '2px';
        } else if (float_left[kmid]) {
            keyboxstyle.left = '2px';
        }
        const keybox = EL(
            'div',
            {
                class: 'key green',
                'data-kmid': kmid,
                style: keyboxstyle,
            },
            `${kmid}`
        );
        const keyimage = EL(
            'div',
            {
                class: 'key keybg',
                style: keystyle,
            },
            keybox
        );

        const keycap = EL(
            'div',
            {
                class: outerClasses,
                style: outerStyle,
            },
            keyimage
        );

        const keydata = {
            cap: keycap,
            image: keybox,
            id: kmid,
            ...opts,
        };
        return keydata;
    }

    ////////////////////////////////////
    //
    //  Draw the entire board.
    //
    ////////////////////////////////////
    const keylayout = KBINFO.keylayout;
    // keys[kmid] = {image: element, text: element};

    const layerSelection = get('#layer-selection');
    const board = get('#mainboard');

    function renderBoardInto(par) {
        let mykeys = {};
        // Current settings.
        let children = [];

        const bounds = {
            top: Infinity,
            left: Infinity,
            right: -Infinity,
            bottom: -Infinity,
        };

        for (const [kmid, key] of Object.entries(keylayout)) {
            const keydata = renderKey(kmid, key);
            mykeys[kmid] = keydata;

            const top = parseInt(keydata.image.style.top, 10);
            const left = parseInt(keydata.image.style.left, 10);
            const width = parseInt(keydata.image.style.width, 10);
            const height = parseInt(keydata.image.style.height, 10);
            bounds.top = Math.min(bounds.top, top);
            bounds.left = Math.min(bounds.left, left);
            bounds.right = Math.max(bounds.right, left + width);
            bounds.bottom = Math.max(bounds.bottom, top + height);

            children.push(keydata.cap);
        }
        appendChildren(par, ...children);

        // This allows us to center the board on screen.
        par.style['width'] = `${bounds.right + bounds.left + 40}px`;
        par.style['height'] = `${bounds.bottom + 20}px`;
        par.style['left'] = `20px`;
        par.style['top'] = `0px`;

        // Calculate and set initial scale
        const container = par.closest('.small-board-container');
        if (container) {
            setTimeout(() => {
                updateKeyboardScale(par);
            }, 1);
        }

        return mykeys;
    }
    const boardKeys = renderBoardInto(board);

    // Add resize listener to update scale
    window.addEventListener('resize', () => {
        const boards = document.querySelectorAll('.kb-board');
        boards.forEach((board) => {
            const container = board.closest('.small-board-container');
            if (container) {
                updateKeyboardScale(board);
            }
        });
    });

    // Initial scale update for all boards
    const allBoards = document.querySelectorAll('.kb-board');
    allBoards.forEach((board) => {
        const container = board.closest('.small-board-container');
        if (container) {
            setTimeout(() => updateKeyboardScale(board), 1);
        }
    });

    ////////////////////////////////////
    //
    //  Update all the keys to show the given layer.
    //
    ////////////////////////////////////
    function drawLayer(layerid, keys, printable) {
        if (layerid < 0 || layerid >= KBINFO.layers) {
            layerid = 0;
        }
        if (!keys) {
            keys = boardKeys;
        }
        MAINBOARD.selectedLayer = layerid;
        const layerkeymap = KBINFO.keymap[layerid];
        const oldkeymap = BASE_KBINFO.keymap[layerid];
        for (const [kmid, key] of Object.entries(keys)) {
            keys[kmid].image.dataset.key = layerkeymap[kmid];
            keys[kmid].image.dataset.kmid = kmid;
            keys[kmid].image.dataset.bound = 'main';
            if (layerkeymap[kmid] === oldkeymap[kmid]) {
                keys[kmid].image.classList.remove('changed');
            } else {
                keys[kmid].image.classList.add('changed');
            }
            if (printable) {
                KEYUI.refreshKey(keys[kmid].image);
            }
        }

        for (const layer of findAll('.layer')) {
            layer.classList.remove('selected');
            console.log('child of layer', layer.children);
            for (const child of layer.children) {
                if (child.classList.contains('edit-icon')) {
                    child.remove();
                }
            }
        }

        const selectedLayer = find(`[data-layerid="${layerid}"]`);
        if (selectedLayer) {
            const layerIndex = parseInt(
                selectedLayer.dataset.editableIndex,
                10
            );
            const layerHeaderTitle = get('#layer-header-title');
            const names = getSaved('names', {});
            const displayName = names.layer[layerIndex] || layerIndex;
            layerHeaderTitle.textContent = `${displayName}`;
            console.log('layerIndex', layerIndex);
            selectedLayer.classList.add('selected');
            const editIcon = EL(
                'div',
                {
                    class: 'edit-icon',
                    style: {
                        float: 'right',
                        position: 'absolute',
                        top: '0px',
                        right: '-10px',
                        zIndex: '100',
                        background: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.2)',
                    },
                },
                '<svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/></svg>'
            );
            selectedLayer.appendChild(editIcon);
            onClickEditIcon(editIcon, 'layer', layerIndex);
        }

        ACTION.selectKey();
        if (!printable) {
            KEYUI.refreshAllKeys();
        }
        ACTION.selectKey();
    }

    ////////////////////////////////////
    //
    //  Called when a file is uploaded or a device is connected after a file
    //  is uploaded. Mark and queue all changes.
    //
    ////////////////////////////////////
    MAINBOARD.updateAll = () => {
        drawLayer(MAINBOARD.selectedLayer);

        for (let ilayer = 0; ilayer < KBINFO.layers; ilayer++) {
            const layer = ilayer;
            for (let ikmid = 0; ikmid < KBINFO.keymap[layer].length; ikmid++) {
                const kmid = ikmid;
                const keystr = KBINFO.keymap[layer][kmid];
                const bkeystr = BASE_KBINFO.keymap[layer][kmid];
                if (
                    !(
                        (keystr === -1 || keystr === 0xff) &&
                        (bkeystr === -1 || bkeystr === 0xff)
                    )
                ) {
                    if (keystr !== bkeystr) {
                        CHANGES.queue('key' + layer + '.' + kmid, () =>
                            KBAPI.updateKey(layer, kmid, keystr)
                        );
                    }
                }
            }
        }
    };

    let serial = {};

    function arytomap(ary) {
        ary = ary.filter((kmid) => {
            return findAll('[data-kmid="' + kmid + '"]').length > 0;
        });
        const ret = {};
        ret[ary[ary.length - 1]] = ary[0];
        for (let i = 0; i < ary.length - 1; i++) {
            ret[ary[i]] = ary[i + 1];
        }
        return ret;
    }

    const serials = {
        colfirst: () => {
            return arytomap(range(KBINFO.keymap[0].length));
        },
        rowfirst: () => {
            const ret = [];
            for (let col = 0; col < KBINFO.cols; col++) {
                for (let row = 0; row < KBINFO.rows; row++) {
                    ret.push(row * KBINFO.cols + col);
                }
            }
            return arytomap(ret);
        },
        svalbykey: () => {
            return arytomap([
                // N keys
                27, 21, 15, 9, 39, 45, 51, 57,
                // C keys
                26, 20, 14, 8, 38, 44, 50, 56,
                // S keys
                24, 18, 12, 6, 36, 42, 48, 54,
                // W keys
                28, 22, 16, 10, 40, 46, 52, 58,
                // E keys
                25, 19, 13, 7, 37, 43, 49, 55,

                // Thumb clusters, Claussen-style.
                // Top row
                3, 5, 1, 31, 35, 33, 4, 2, 0, 30, 32, 34,
            ]);
        },
    };

    ACTION.onclick('[data-serial]', (target) => {
        serial = serials[target.dataset.serial]();
        ACTION.menuClose();
    });

    function prepKeyAssignment(target) {
        ACTION.selectKey(target);
    }

    ACTION.on('bind-main', (keystr, target) => {
        const kmid = target.dataset.kmid;
        const curLayer = MAINBOARD.selectedLayer;
        if (keystr !== target.dataset.key) {
            KBINFO.keymap[curLayer][kmid] = keystr;
            target.dataset.key = keystr;
            target.classList.add('changed');
            CHANGES.queue('key' + curLayer + '.' + kmid, () =>
                KBAPI.updateKey(curLayer, kmid, keystr)
            );
            KEYUI.refreshKey(target);
        }
        ACTION.selectKey();
        if (kmid in serial) {
            prepKeyAssignment(get(`[data-kmid="${serial[kmid]}"]`));
        }
    });

    ////////////////////////////////////
    //
    // Menu bar: [0, 1, NAS, 3, MOUSE, 4, ...]
    // Draw the layer IDs and Names.
    //
    ////////////////////////////////////
    children = [];
    for (let i = 0; i < KBINFO.layers; i++) {
        const layerid = i;
        let layerName = getEditableName('layer', i, '' + i);
        const layerSel = EL('div', {
            'data-layerid': layerid,
            class: 'layer',
        });
        makeEditableName(layerSel, 'layer', i);
        children.push(layerSel);
    }
    appendChildren(layerSelection, ...children);

    ACTION.onclick('[data-layerid]', (target) => {
        setSaved('layerid', target.dataset.layerid);
        drawLayer(target.dataset.layerid);
    });

    drawLayer(getSaved('layerid', 0));

    ////////////////////////////////////
    //
    //  Render a printable layer in a separate window.
    //
    ////////////////////////////////////

    MAINBOARD.printLayers = (layerids) => {
        var printer = window.open('', '_blank');
        printer.document.write('<html>');
        printer.document.write('<head>');
        printer.document.write('<title>Printable layers</layer></title>');
        printer.document.write('<link rel="stylesheet" href="css/print.css">');
        printer.document.write('<link rel="stylesheet" href="css/keys.css">');
        printer.document.write('</head>');
        printer.document.write('<body>');

        function isEmpty(layerid) {
            const layer = KBINFO.keymap[layerid];
            for (let i = 0; i < layer.length; i++) {
                if (layer[i] !== 'KC_NO') {
                    return false;
                }
            }
            return true;
        }

        // Render each layer.
        for (const layerid of layerids) {
            if (isEmpty(layerid)) {
                continue;
            }
            let name = `Layer ${layerid}`;
            const customname = getEditableName('layer', layerid);
            if (customname) {
                name = `Layer ${layerid} - ${customname}`;
            }
            const div = EL(
                'div',
                { class: 'printable-mainboard', id: 'p-' + layerid },
                EL('p', { class: 'printable-title' }, [
                    name,
                    EL(
                        'button',
                        {
                            class: 'no-print',
                            onclick:
                                'this.parentElement.parentElement.replaceWith("");',
                        },
                        'Remove this layer'
                    ),
                ])
            );
            const mykeys = renderBoardInto(div);
            const pparent = EL('div', {}, div);
            drawLayer(layerid, mykeys, true);
            printer.document.write(pparent.innerHTML);
        }

        printer.document.write('</body>');
        printer.document.write('</html>');
    };

    ACTION.onclick('#print-layers', () => {
        MAINBOARD.printLayers(range(16));
    });

    ACTION.on('key-revert-main', (target) => {
        const kmid = target.dataset.kmid;
        const layer = MAINBOARD.selectedLayer;
        const oldkey = BASE_KBINFO.keymap[layer][kmid];
        target.dataset.key = oldkey;
        target.classList.remove('changed');
        KEYUI.refreshKey(target);
        KBINFO.keymap[layer][kmid] = oldkey;
        CHANGES.clear('key' + layer + '.' + kmid);
    });

    const qwertyTabs = getAll('.qwerty-tabs .tab');
    const qwertyContainers = getAll('.qwerty-tab-container');

    function selectTab(target) {
        for (const tab of qwertyTabs) {
            console.log(tab.dataset);
            if (tab.dataset.qwertyTab === target) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        }
        for (const container of qwertyContainers) {
            if (container.id === target) {
                container.style.display = 'flex';
            } else {
                container.style.display = 'none';
            }
        }
        setSaved('data-qwerty-tab', target);
    }
    ACTION.onclick('[data-qwerty-tab]', (target) => {
        selectTab(target.dataset.qwertyTab);
    });
    selectTab('qwerty-numpad');
});
