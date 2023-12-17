import { PresencaCultoController } from "../Controllers/Culto";
import { PresencaCultoRepositorie } from "../Repositories/Culto";


describe('PresencaCultoController', () => {
  it('should create a new presence', async () => {
    // Mock data for the test
    const mockRequest = {} as any;

    // Mock the methods in the reply object
    const mockReply = { code: jest.fn(), send: jest.fn() } as any;

    const mockPresencaCultoData = {
      id: 'some-id',
      status: true,
      userId: 'membro-id',
      cultoIndividualId: 'culto-id',
      date_create: new Date(),
      date_update: new Date(),
    };

    // Mock the createPresencaCulto function in the repository
    PresencaCultoRepositorie.createPresencaCulto = jest.fn().mockResolvedValue(mockPresencaCultoData);

    // Call the store method in the controller
    await PresencaCultoController.store(mockRequest, mockReply);

    // Expect that createPresencaCulto is called with the correct data
    expect(PresencaCultoRepositorie.createPresencaCulto).toHaveBeenCalledWith(
      expect.objectContaining({
        membro: expect.any(String),
        presenca_culto: expect.any(String),
        status: expect.any(Boolean),
      })
    );

    // Expect that reply.code is called with the correct status code
    expect(mockReply.code).toHaveBeenCalledWith(201);

    // Expect that reply.send is called with the correct data
    expect(mockReply.send).toHaveBeenCalledWith(mockPresencaCultoData);
  });
});
