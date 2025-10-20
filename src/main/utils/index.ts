/**
 * 格式化从右向左读取的数字字符串
 * @param {string} str - 输入字符串，例如 ".0023000=" 或 "0.04010="
 * @returns {number} 格式化后的数字
 */
export const formatReverseNumber = (str: string) => {
    const cleaned = str.replace(/[^0-9.]/g, '');
    const reversed = cleaned.split('').reverse().join('');
    return parseFloat(reversed);
}

export default { formatReverseNumber }