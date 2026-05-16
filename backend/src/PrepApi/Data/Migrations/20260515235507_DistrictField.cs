using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrepApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class DistrictField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "District",
                table: "Actas",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "District",
                table: "Actas");
        }
    }
}
