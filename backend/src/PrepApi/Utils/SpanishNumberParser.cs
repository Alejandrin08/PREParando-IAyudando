namespace PrepApi.Utils;

public static class SpanishNumberParser
{
    private static readonly Dictionary<string, int> Units = new(StringComparer.OrdinalIgnoreCase)
    {
        {"cero",0},{"uno",1},{"un",1},{"una",1},{"dos",2},{"tres",3},
        {"cuatro",4},{"cinco",5},{"seis",6},{"siete",7},{"ocho",8},
        {"nueve",9},{"diez",10},{"once",11},{"doce",12},{"trece",13},
        {"catorce",14},{"quince",15},{"dieciséis",16},{"dieciseis",16},
        {"diecisiete",17},{"dieciocho",18},{"diecinueve",19},
        {"veinte",20},{"veintiuno",21},{"veintidós",22},{"veintidos",22},
        {"veintitrés",23},{"veintitres",23},{"veinticuatro",24},
        {"veinticinco",25},{"veintiséis",26},{"veintiseis",26},
        {"veintisiete",27},{"veintiocho",28},{"veintinueve",29},
    };

    private static readonly Dictionary<string, int> Tens = new(StringComparer.OrdinalIgnoreCase)
    {
        {"treinta",30},{"cuarenta",40},{"cincuenta",50},
        {"sesenta",60},{"setenta",70},{"ochenta",80},{"noventa",90},
    };

    private static readonly Dictionary<string, int> Hundreds = new(StringComparer.OrdinalIgnoreCase)
    {
        {"cien",100},{"ciento",100},{"doscientos",200},{"doscientas",200},
        {"trescientos",300},{"trescientas",300},{"cuatrocientos",400},
        {"cuatrocientas",400},{"quinientos",500},{"quinientas",500},
        {"seiscientos",600},{"seiscientas",600},{"setecientos",700},
        {"setecientas",700},{"ochocientos",800},{"ochocientas",800},
        {"novecientos",900},{"novecientas",900},
    };

    public static int? Parse(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var normalized = text.Trim()
            .ToLowerInvariant()
            .Replace("á", "a").Replace("é", "e").Replace("í", "i")
            .Replace("ó", "o").Replace("ú", "u");

        if (int.TryParse(normalized, out var direct)) return direct;

        var words = normalized
            .Split(new[] { ' ', '\t', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w != "y")
            .ToList();

        if (!words.Any()) return null;

        int total = 0;
        int current = 0;

        foreach (var word in words)
        {
            if (Hundreds.TryGetValue(word, out var h))
            {
                current += h;
            }
            else if (Tens.TryGetValue(word, out var t))
            {
                current += t;
            }
            else if (Units.TryGetValue(word, out var u))
            {
                current += u;
            }
            else if (word == "mil")
            {
                current = current == 0 ? 1000 : current * 1000;
                total += current;
                current = 0;
            }
            else
            {
                return null;
            }
        }

        return total + current;
    }
}