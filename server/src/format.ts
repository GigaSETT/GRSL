import { tokensWithEnd, KEYWORDS } from "./common";
import { DEFAULT_WHITESPACES, STOP_CHARS, varType, kwdNum, SkipComment, intersNum, OLC, MLC_O, MLC_C, DIGITS } from './enums';

export function FormatCode(text: string, tabSize: number = 4): string {
    const lines = text.split('\n');
    let formattedText = '';
    let indentLevel = 0;
    let isComment = false;

    lines.forEach((line) => {

        let trimmedLine = line.trim();

        //Определяем начало многострочного комментария
        if (trimmedLine.startsWith(MLC_O)) {
            isComment = true
        }

        if (isComment) {
            formattedText += `${line}\n`;
            if (trimmedLine.endsWith(MLC_C)) {
                isComment = false
            }
            return;
        }

        if (trimmedLine.startsWith('//')) {
            formattedText += `${line}\n`;
            return;
        }

        const wordsInLine = extractWordsBeforeComment(trimmedLine);

        wordsInLine.forEach((word, index) => wordsInLine[index] = removeStopCharsAlternative(word))

        trimmedLine = replaceKWords(trimmedLine);

        // Добавляем пробелы вокруг ключевых слов и операторов
        trimmedLine = trimmedLine.replace(/\b(And|Or)\b/g, ' $1 ');
        trimmedLine = trimmedLine.replace(/(==|!=|<=|>=|>|<)/g, ' $1 ');


        trimmedLine = trimmedLine.replace(/\b(If|While|For|\;)\b/g, '$1 ');

        trimmedLine = trimmedLine.replace(/\s+/g, ' ');

        //Удаляем пробелы
        trimmedLine = trimmedLine.trim();

        // Исключения вложенного блока кода для MACRO и END в одной строке.
        if (wordsInLine.some(element => tokensWithEnd._it.includes(element.toLowerCase()))
            && (wordsInLine.some(element => KEYWORDS._it[kwdNum._end] === element.toLowerCase()))) {
            const indent = ' '.repeat(tabSize * indentLevel);
            formattedText += `${indent}${trimmedLine}\n`;
            return;
        }

        // Исключения вложенного блока кода для ELIF.
        if (wordsInLine.some(element => 'else' === element.toLowerCase())
            || wordsInLine.some(element => 'elif' === element.toLowerCase())) {
            const localIndantLevel = Math.max(indentLevel - 1, 0);
            const indent = ' '.repeat(tabSize * localIndantLevel);
            formattedText += `${indent}${trimmedLine}\n`;
            return;
        }

        // Проверьте вложенного блока кода.
        if (wordsInLine.some(element => tokensWithEnd._it.includes(element.toLowerCase()))) {
            // Применить текущий отступ, а затем увеличить его для следующей строки.
            const indent = ' '.repeat(tabSize * indentLevel);
            formattedText += `${indent}${trimmedLine}\n`;
            indentLevel++;
            return; // Перейти к следующей итерации
        }

        // Проверить конец блока
        if (wordsInLine.some(element => KEYWORDS._it[kwdNum._end] === element.toLowerCase())) {
            // Уменьшите отступ, а затем примените
            indentLevel = Math.max(indentLevel - 1, 0);
            const indent = ' '.repeat(tabSize * indentLevel);
            formattedText += `${indent}${trimmedLine}\n`;
            return; // Перейти к следующей итерации
        }

        // Обработка вложенных строк кода, отмеченных '/\t/g'
        const nestedIndentCount = (trimmedLine.match(/\/\\t\/g/g) || []).length;
        indentLevel += nestedIndentCount;
        // Удалите '/\\t/g' для форматирования.
        let cleanedLine = line.replace(/\/\\t\/g/g, '').trim();

        // Применить комбинированный отступ
        const indent = ' '.repeat(tabSize * indentLevel);
        formattedText += `${indent}${cleanedLine}\n`;

        // Сбросить уровень отступа после обработки вложенной строки кода
        indentLevel -= nestedIndentCount;

    });

    return formattedText.trim(); // Обрежьте последнюю строку, чтобы удалить все конечные символы новой строки.
}

function removeStopCharsAlternative(inputString: string): string {
    // Преобразуем STOP_CHARS в массив символов для последующего использования
    const stopCharsArray = Array.from(STOP_CHARS);
    // Разбиваем входную строку на массив символов и фильтруем его
    const filteredChars = Array.from(inputString).filter(char => !stopCharsArray.includes(char));
    // Объединяем отфильтрованные символы обратно в строку
    return filteredChars.join('');
}

function extractWordsBeforeComment(input: string): string[] {
    // Удаляем комментарий и всё, что после него
    const withoutComment = input.split('//')[0];

    // Регулярное выражение для поиска слов, игнорируя кавычки
    // Оно ищет либо последовательности символов вне кавычек, либо последовательности в кавычках, чтобы игнорировать их
    const regex = /"[^"]*"|(\b\w+\b)/g;

    const words: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(withoutComment)) !== null) {
        // Если слово не в кавычках, добавляем его в массив
        if (match[1]) {
            words.push(match[1]);
        }
    }

    return words;
}

function replaceKWords(param: string): string {
    // словарь ключевых слов
    const keywordMap: Record<string, string> = {
        "import": "Import",
        "private": "Private",
        "macro": "MACRO",
        "private macro": "PRIVATE MACRO",
        "and": "And",
        "begaction": "BegAction",
        "break": "Break",
        "codefor": "CodeFor",
        "const": "Const",
        "continue": "Continue",
        "clearrecord": "ClearRecord",
        "callr2m": "CallR2M",
        "debugbreak": "DebugBreak",
        "dttmsplit": "DtTmSplit",
        "datetime": "DateTime",
        "datesplit": "DateSplit",
        "date": "Date",
        "dateshift": "DateShift",
        "endaction": "EndAction",
        "elif": "ElIf",
        "else": "Else",
        "end": "End",
        "exit": "Exit",
        "false": "False",
        "if": "If",
        "integer": "Integer",
        "int": "Int",
        "message": "Message",
        "msgbox": "MsgBox",
        "null": "Null",
        "not": "Not",
        "or": "Or",
        "println": "PrintLn",
        "record": "Record",
        "return": "Return",
        "strlen": "StrLen",
        "strbrk": "StrBrk",
        "substr": "SubStr",
        "string": "String",
        "strset": "StrSet",
        "strupr": "StrUpr",
        "strlwr": "StrLwr",
        "strfor": "StrFor",
        "strsubst": "StrSubst",
        "setparm": "SetParm",
        "trim": "Trim",
        "tooem": "ToOEM",
        "true": "True",
        "toansi": "ToANSI",
        "timesplit": "TimeSplit",
        "time": "Time",
        "var": "Var",
        "valtype": "ValType",
        "while": "While"
    };

    // разбиваем строку на токены: слова, кавычки, операторы и пробелы
    return param.replace(/\w+|\S/g, (token) => {
        const lower = token.toLowerCase();
        if (keywordMap[lower]) {
            return keywordMap[lower];
        }
        return token;
    });
}