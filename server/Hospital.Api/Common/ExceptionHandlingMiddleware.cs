using System.Text.Json;
using Hospital.Domain.Exceptions;

namespace Hospital.Api.Common;

/// <summary>Translates domain/exception types into consistent JSON error payloads.</summary>
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (SlotUnavailableException ex)
        {
            await Write(context, StatusCodes.Status409Conflict, new ApiError(ex.Message, "slot_unavailable"));
        }
        catch (InvalidStatusTransitionException ex)
        {
            await Write(context, StatusCodes.Status422UnprocessableEntity, new ApiError(ex.Message, "invalid_transition"));
        }
        catch (BusinessRuleException ex)
        {
            await Write(context, StatusCodes.Status400BadRequest, new ApiError(ex.Message, "business_rule"));
        }
        catch (ForbiddenException ex)
        {
            await Write(context, StatusCodes.Status403Forbidden, new ApiError(ex.Message, "forbidden"));
        }
        catch (UnauthorizedAccessException ex)
        {
            await Write(context, StatusCodes.Status401Unauthorized, new ApiError(ex.Message, "unauthorized"));
        }
        catch (KeyNotFoundException ex)
        {
            await Write(context, StatusCodes.Status404NotFound, new ApiError(ex.Message, "not_found"));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await Write(context, StatusCodes.Status500InternalServerError, new ApiError("An unexpected error occurred.", "server_error"));
        }
    }

    private static async Task Write(HttpContext context, int status, ApiError error)
    {
        if (context.Response.HasStarted)
            return;

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions));
    }
}
