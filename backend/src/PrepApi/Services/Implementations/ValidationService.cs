using PrepApi.Models;
using PrepApi.Services.Interfaces;
using PrepApi.Utils;

namespace PrepApi.Services.Implementations
{

    public class ValidationService : IValidationService
    {
        private static readonly HashSet<string> VoteFields = new()
    {
        "votos_pan", "votos_pri", "votos_morena", "votos_prd",
        "votos_mc", "votos_pt", "votos_pvem",
        "votos_coalicion_pan_pri_prd", "votos_coalicion_pan_pri",
        "votos_coalicion_pri_prd", "votos_coalicion_pan_prd",
        "votos_coalicion_pvem_pt_morena", "votos_coalicion_pt_morena",
        "votos_coalicion_pvem_morena", "votos_coalicion_pvem_pt",
        "votos_candidatos_no_registrados", "votos_nulos"
    };

        private static readonly Dictionary<string, int> ListaNominalPorSeccion = new Dictionary<string, int>
        {
            { "1806", 598 },
            { "1807", 413 },
            { "1808", 422 },
            { "1809", 580 },
            { "1810", 689 },
            { "21812", 440 },
            { "1813", 724 },
            { "1814", 451 },
            { "1815", 397 },
            { "1816", 508 },
            { "1817", 546 },
            { "1818", 534 },
            { "1819", 686 },
            { "1820", 622 }
        };

        public List<ActaValidation> Validate(ExtractionResult extraction)
        {
            var validations = new List<ActaValidation>();
            var fields = extraction.Fields.ToDictionary(f => f.Name, f => f.Value);

            validations.Add(ValidateTotalVotes(fields));
            validations.Add(ValidateTotalMatchesUrnas(fields));
            validations.Add(ValidatePersonasMatchUrnas(fields));
            validations.AddRange(ValidateNumberVsLetter(fields));

            return validations;
        }

        private static IEnumerable<ActaValidation> ValidateNumberVsLetter(
            Dictionary<string, string?> fields)
        {
            var validations = new List<ActaValidation>();

            var letterFields = fields.Keys
                .Where(k => k.EndsWith("_letra"))
                .ToList();

            foreach (var letterField in letterFields)
            {
                var numericFieldName = letterField.Replace("_letra", "");
                if (!fields.ContainsKey(numericFieldName)) continue;

                var ruleName = $"NumberLetterMatch_{numericFieldName}";

                if (!TryGetInt(fields, numericFieldName, out var numericValue))
                {
                    validations.Add(Inconclusive(ruleName,
                        $"No se pudo leer el valor numérico de {numericFieldName}"));
                    continue;
                }

                var letterText = fields[letterField];
                var parsedFromLetter = SpanishNumberParser.Parse(letterText);

                if (parsedFromLetter == null)
                {
                    validations.Add(new ActaValidation
                    {
                        RuleName = ruleName,
                        Passed = false,
                        Detail = $"No se pudo interpretar '{letterText}' como número en {letterField}"
                    });
                    continue;
                }

                var passed = numericValue == parsedFromLetter.Value;
                validations.Add(new ActaValidation
                {
                    RuleName = ruleName,
                    Passed = passed,
                    Detail = passed
                        ? $"El número ({numericValue}) coincide con la letra '{letterText}' ({parsedFromLetter})"
                        : $"Discrepancia: el número dice {numericValue} pero la letra dice '{letterText}' ({parsedFromLetter})"
                });
            }

            return validations;
        }

        private static ActaValidation ValidateTotalVotes(Dictionary<string, string?> fields)
        {
            var ruleName = "SumOfVotesMatchesTotal";
            var ruleNameFail = "SumOfVotesDoNotMatchesTotal";

            if (!TryGetInt(fields, "total_votos", out var declaredTotal))
                return Inconclusive(ruleName, "total_votos field missing or unreadable");

            var sum = VoteFields
                .Where(f => TryGetInt(fields, f, out _))
                .Sum(f => { TryGetInt(fields, f, out var v); return v; });

            var passed = sum == declaredTotal;
            return new ActaValidation
            {
                RuleName = passed ? ruleName : ruleNameFail,
                Passed = passed,
                Detail = passed
                    ? $"Sum {sum} matches total_votos {declaredTotal}"
                    : $"Sum of votes {sum} does not match total_votos {declaredTotal}"
            };
        }

        private static ActaValidation ValidateTotalMatchesUrnas(Dictionary<string, string?> fields)
        {
            var ruleName = "TotalVotesMatchUrnas";
            var ruleNameFail = "TotalVotesDoNotMatchUrnas";

            if (!TryGetInt(fields, "total_votos", out var total) ||
                !TryGetInt(fields, "total_votos_urnas", out var urnas))
                return Inconclusive(ruleName, "total_votos or total_votos_urnas missing");

            var passed = total == urnas;
            return new ActaValidation
            {
                RuleName = passed ? ruleName : ruleNameFail,
                Passed = passed,
                Detail = passed
                    ? $"total_votos {total} matches total_votos_urnas {urnas}"
                    : $"total_votos {total} does not match total_votos_urnas {urnas}"
            };
        }

        private static ActaValidation ValidatePersonasMatchUrnas(Dictionary<string, string?> fields)
        {
            var ruleName = "PersonasVotaronMatchUrnas";
            var ruleNameFail = "PersonasVotaronDoNotMatchUrnas";

            if (!TryGetInt(fields, "total_personas_votaron", out var personas) ||
                !TryGetInt(fields, "total_votos_urnas", out var urnas))
                return Inconclusive(ruleName, "total_personas_votaron or total_votos_urnas missing");

            var passed = personas == urnas;
            return new ActaValidation
            {
                RuleName = passed ? ruleName : ruleNameFail,
                Passed = passed,
                Detail = passed
                    ? $"total_personas_votaron {personas} matches total_votos_urnas {urnas}"
                    : $"total_personas_votaron {personas} does not match total_votos_urnas {urnas}"
            };
        }

        private static ActaValidation ValidateNoFieldExceedsNominal(Dictionary<string, string?> fields, string? seccionValue)
        {
            var ruleName = "TotalVotesDoNotExceedNominal";
            var ruleNameFail = "TotalVotesExceedNominal";


            if (string.IsNullOrEmpty(seccionValue) ||
                !TryGetInt(fields, "total_votos", out var total))
                return Inconclusive(ruleName, $"seccion or total_votos missing");

            var listaNominal = ListaNominalPorSeccion.ContainsKey(seccionValue) ? ListaNominalPorSeccion[seccionValue] : 0;
            var passed = total <= listaNominal;
            return new ActaValidation
            {
                RuleName = passed ? ruleName : ruleNameFail,
                Passed = passed,
                Detail = passed
                    ? $"total_votos {total} is within lista_nominal {listaNominal}"
                    : $"total_votos {total} exceeds lista_nominal {listaNominal}"
            };
        }

        private static bool TryGetInt(Dictionary<string, string?> fields, string key, out int value)
        {
            value = 0;
            return fields.TryGetValue(key, out var raw) &&
                   raw != null &&
                   int.TryParse(raw.Trim(), out value);
        }

        private static ActaValidation Inconclusive(string ruleName, string reason) => new()
        {
            RuleName = ruleName,
            Passed = false,
            Detail = $"Inconclusive: {reason}"
        };
    }
}