// usbraw.js
//
////////////////////////////////////
//
//  Raw information and interaction with USB.
//
////////////////////////////////////

const MSG_LEN = 32;

function endianFrom(num, bytes, little) {
  const ab = new ArrayBuffer(bytes);
  const dv = new DataView(ab);

  switch (bytes) {
    case 2: dv.setInt16(0, num, little); break;
    case 4: dv.setInt32(0, num, little); break;
  }
  return Array.from(new Uint8Array(ab));
}

function convArrayEndian(ary, size) {
  if (size === 2) {
    return ary.map((num) => (((num >> 8) & 0xFF) | ((num << 8) & 0xFF00)));
  } else {
    return ary.map((num) => (
      ((num << 24) & 0xFF000000) |
      ((num << 8) & 0xFF0000) |
      ((num >> 8) & 0xFF00) |
      ((num >> 24) & 0xFF)));
  }
}

function LE32(num) {
  return endianFrom(num, 4, true);
}

function LE16(num) {
  return endianFrom(num, 2, true);
}

function BE32(num) {
  return endianFrom(num, 4, false);
}

function BE16(num) {
  return endianFrom(num, 2, false);
}

const USB = {
  // This will be set to the opened device.
  device: undefined,

  // This is updated for every send()
  listener: (data, ev) => {},

  open: async function(filters) {
    const devices = await navigator.hid.requestDevice({
      filters: filters,
    });

    if (devices.length !== 1) return false;

    USB.device = devices[0];
    const opened = await USB.device.open()
    console.log("open returned", opened);

    await USB.initListener();

    return true;
  },

  initListener: () => {
    USB.device.addEventListener('inputreport', (ev) => {
      // console.log(ev.data);
      if (USB.listener) {
        x = ev.data;
        USB.listener(ev.data.buffer, ev);
      }
    });
  },

  formatResponse: (data, flags) => {
    console.log(data);
    let ret;
    let cls = Uint8Array;
    let bytes = 1;
    // Which bytes?
    if (flags.int8) { cls = Int8Array; }
    if (flags.int16) { cls = Int16Array; bytes = 2; }
    if (flags.uint16) { cls = Uint16Array; bytes = 2; }
    if (flags.int32) { cls = Int32Array; bytes = 4; }
    if (flags.uint32) { cls = Uint32Array; bytes = 4; }
    ret = new cls(data);
    if (flags.bigendian) {
      ret = convArrayEndian(ret, bytes);
    }

    if (flags.index !== undefined) {
      ret = ret[flags.index];
    } else if (flags.slice) {
      if (flags.slice.length) {
        ret = ret.slice(...flags.slice);
      } else {
        ret = ret.slice(flags.slice);
      }
    }
    if (flags.string) {
      ret = new TextDecoder().decode(ret);
    }
    return ret;
  },

  send: (cmd, args, flags) => {
    // Format what we're sending.
    // cmd must be one byte. Browser will throw the error
    // anyway.
    let ary = [cmd];
    if (args) { ary = [cmd, ...args]; }
    for (let i = ary.length; i < MSG_LEN; i++) {
      ary.push(0);
    }

    // Callback for when we get a response.
    const cbpromise = new Promise((res, rej) => {
      USB.listener = (data, ev) => {
        const ret = USB.formatResponse(data, flags);
        res(ret);
      };
    });
    // Send update and respond to callback.
    const sendpromise = USB.device.sendReport(0, new Uint8Array(ary));
    sendpromise.then(cbpromise)

    return cbpromise;
  },
}
