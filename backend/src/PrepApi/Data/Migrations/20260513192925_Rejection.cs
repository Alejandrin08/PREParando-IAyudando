using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrepApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class Rejection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectionCategory",
                table: "Actas",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Actas",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectionCategory",
                table: "Actas");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Actas");
        }
    }
}
