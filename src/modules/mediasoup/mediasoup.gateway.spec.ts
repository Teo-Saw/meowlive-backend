import { Test, TestingModule } from '@nestjs/testing';
import { MediasoupGateway } from './mediasoup.gateway';
import { MediasoupService } from './mediasoup.service';

describe('MediasoupGateway', () => {
  let gateway: MediasoupGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediasoupGateway, MediasoupService],
    }).compile();

    gateway = module.get<MediasoupGateway>(MediasoupGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
