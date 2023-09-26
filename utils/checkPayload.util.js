/**
 * validates socket event payload
 * @param {string[]} fields
 * @param {{[fields: string]: string | number}} payload
 */

function CheckPayload(fields, payload) {
  if (!payload || typeof payload !== "object" || !Object.values(payload).length || !Array.isArray(fields) || !fields.length) {
    return false;
  }

  // eslint-disable-next-line consistent-return
  fields.forEach((f) => {
    if (!payload[f]) {
      return false;
    }
  });

  return true;
}

module.exports = CheckPayload;
