using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ride.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSlugFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FacebookName",
                table: "AspNetUsers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstagramName",
                table: "AspNetUsers",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SellerName",
                table: "AspNetUsers",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SellerSlug",
                table: "AspNetUsers",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FacebookName",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "InstagramName",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "SellerName",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "SellerSlug",
                table: "AspNetUsers");
        }
    }
}
