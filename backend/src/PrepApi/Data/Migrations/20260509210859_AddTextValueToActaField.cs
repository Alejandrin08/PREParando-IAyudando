using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrepApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTextValueToActaField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Value",
                table: "ActaFields",
                newName: "NumericValue");

            migrationBuilder.AddColumn<string>(
                name: "TextValue",
                table: "ActaFields",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TextValue",
                table: "ActaFields");

            migrationBuilder.RenameColumn(
                name: "NumericValue",
                table: "ActaFields",
                newName: "Value");
        }
    }
}
